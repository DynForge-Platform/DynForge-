package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingRequest;
import com.dynforge.be.model.dto.BookingResponse;
import com.dynforge.be.model.dto.MentorEarningsResponse;
import com.dynforge.be.model.dto.RescheduleRequest;
import com.dynforge.be.model.dto.RescheduleRespondRequest;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.Course;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.EscrowTransactionRepository;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashMap;
import java.util.UUID;

@Service
public class BookingService {

    private static final double DEFAULT_COMMISSION_RATE = 0.15;

    private static final Set<BookingStatus> UPCOMING_STATUSES =
            EnumSet.of(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED, BookingStatus.TAUGHT);

    private static final List<BookingStatus> CONFLICT_CHECK_STATUSES = List.of(
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.ESCROW_HELD,
            BookingStatus.ACCEPTED,
            BookingStatus.TAUGHT
    );

    private final BookingRepository bookingRepository;
    private final MentorRepository mentorRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final BookingMapper bookingMapper;
    private final EscrowService escrowService;
    private final UserRepository userRepository;
    private final MailService mailService;
    private final MongoTemplate mongoTemplate;
    private final DistributedLockService distributedLockService;
    private Clock clock;

    @Autowired
    public BookingService(
            BookingRepository bookingRepository,
            MentorRepository mentorRepository,
            EscrowTransactionRepository escrowRepository,
            BookingMapper bookingMapper,
            EscrowService escrowService,
            UserRepository userRepository,
            MailService mailService,
            MongoTemplate mongoTemplate,
            DistributedLockService distributedLockService,
            Clock clock
    ) {
        this.bookingRepository = bookingRepository;
        this.mentorRepository = mentorRepository;
        this.escrowRepository = escrowRepository;
        this.bookingMapper = bookingMapper;
        this.escrowService = escrowService;
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.mongoTemplate = mongoTemplate;
        this.distributedLockService = distributedLockService;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public BookingService(
            BookingRepository bookingRepository,
            MentorRepository mentorRepository,
            EscrowTransactionRepository escrowRepository,
            BookingMapper bookingMapper,
            EscrowService escrowService,
            UserRepository userRepository,
            MailService mailService,
            MongoTemplate mongoTemplate,
            DistributedLockService distributedLockService
    ) {
        this(bookingRepository, mentorRepository, escrowRepository, bookingMapper,
                escrowService, userRepository, mailService, mongoTemplate, distributedLockService, Clock.systemUTC());
    }

    public Instant now() {
        return clock != null ? clock.instant() : Instant.now();
    }

    public void setClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public BookingResponse create(User mentee, BookingRequest request) {
        if (!ObjectId.isValid(request.mentorId())) {
            throw new BadRequestException("Invalid mentor id: " + request.mentorId());
        }
        ObjectId mentorUserId = new ObjectId(request.mentorId());

        if (mentorUserId.toHexString().equals(mentee.getId())) {
            throw new BadRequestException("You cannot book a session with yourself");
        }

        MentorProfile mentor = mentorRepository.findByUserId(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + request.mentorId()));

        if (!mentor.isVerified()) {
            throw new BadRequestException("This mentor has not been verified yet");
        }

        Course course = mentor.getCourses() == null ? null : mentor.getCourses().stream()
                .filter(c -> c.getCode().equalsIgnoreCase(request.courseCode()))
                .findFirst()
                .orElse(null);

        if (course == null) {
            throw new BadRequestException(
                    "Mentor does not teach course: " + request.courseCode());
        }

        Instant reqStart = request.startAt();
        Instant reqEnd = reqStart.plus(request.durationMin(), ChronoUnit.MINUTES);

        if (reqStart.isBefore(now())) {
            throw new BadRequestException("Thời gian bắt đầu buổi học phải ở tương lai.");
        }
        if (reqStart.isAfter(now().plus(Duration.ofDays(30)))) {
            throw new BadRequestException("Thời gian đặt lịch không được vượt quá 30 ngày kể từ thời điểm hiện tại.");
        }

        validateMentorAvailability(mentor, reqStart, request.durationMin());

        // Concurrency-safe: serialize booking creation for this mentor using distributed lock
        return distributedLockService.executeWithLock(
                "lock:mentor:" + mentorUserId.toHexString(),
                Duration.ofSeconds(5),
                Duration.ofSeconds(10),
                () -> {
                    Instant currentNow = now();

                    // Check for time overlap in mentor's schedule (including active PENDING_PAYMENT):
                    List<Booking> activeMentorBookings = bookingRepository.findByMentorIdAndStatusIn(
                            mentorUserId,
                            CONFLICT_CHECK_STATUSES
                    );
                    boolean mentorConflict = activeMentorBookings.stream().anyMatch(b -> {
                        if (isExpiredPendingPayment(b, currentNow)) {
                            return false;
                        }
                        Instant existingStart = b.getStartAt();
                        Instant existingEnd = existingStart.plus(b.getDurationMin(), ChronoUnit.MINUTES);
                        return reqStart.isBefore(existingEnd) && reqEnd.isAfter(existingStart);
                    });
                    if (mentorConflict) {
                        throw new BadRequestException("Mentor đã có lịch dạy khác trong khung giờ này. Vui lòng chọn khung giờ khác.");
                    }

                    // Check for time overlap in mentee's personal schedule:
                    List<Booking> activeMenteeBookings = bookingRepository.findByMenteeIdAndStatusIn(
                            new ObjectId(mentee.getId()),
                            CONFLICT_CHECK_STATUSES
                    );
                    boolean menteeConflict = activeMenteeBookings.stream().anyMatch(b -> {
                        if (isExpiredPendingPayment(b, currentNow)) {
                            return false;
                        }
                        Instant existingStart = b.getStartAt();
                        Instant existingEnd = existingStart.plus(b.getDurationMin(), ChronoUnit.MINUTES);
                        return reqStart.isBefore(existingEnd) && reqEnd.isAfter(existingStart);
                    });
                    if (menteeConflict) {
                        throw new BadRequestException("Bạn đã có một buổi học khác trong khung giờ này. Vui lòng kiểm tra lại lịch học của bạn.");
                    }

                    long price = calculatePrice(course, request.format(), request.durationMin());

                    Booking booking = Booking.builder()
                            .menteeId(new ObjectId(mentee.getId()))
                            .mentorId(mentorUserId)
                            .courseCode(request.courseCode())
                            .format(request.format())
                            .startAt(request.startAt())
                            .durationMin(request.durationMin())
                            .price(price)
                            .commissionRate(DEFAULT_COMMISSION_RATE)
                            .status(BookingStatus.PENDING_PAYMENT)
                            .roomId(UUID.randomUUID().toString())
                            .createdAt(currentNow)
                            .build();

                    return bookingMapper.toResponse(bookingRepository.save(booking));
                }
        );
    }

    public List<BookingResponse> listMine(User user) {
        ObjectId userId = new ObjectId(user.getId());

        Map<String, Booking> byId = new LinkedHashMap<>();
        bookingRepository.findByMenteeId(userId).forEach(b -> byId.put(b.getId(), b));
        bookingRepository.findByMentorId(userId).forEach(b -> byId.put(b.getId(), b));

        return byId.values().stream()
                .sorted(Comparator.comparing(Booking::getStartAt).reversed())
                .map(bookingMapper::toResponse)
                .toList();
    }

    /** Mentor schedule: only bookings where the user is the mentor, upcoming first. */
    public List<BookingResponse> listMentorSchedule(User mentor) {
        return bookingRepository.findByMentorId(new ObjectId(mentor.getId())).stream()
                .sorted(Comparator.comparing(Booking::getStartAt))
                .map(bookingMapper::toResponse)
                .toList();
    }

    /** Aggregated earnings snapshot for the mentor console. */
    public MentorEarningsResponse getMentorEarnings(User mentor) {
        ObjectId mentorId = new ObjectId(mentor.getId());

        List<EscrowTransaction> escrows = escrowRepository.findByMentorId(mentorId);

        long pendingClearance = escrows.stream()
                .filter(e -> e.getStatus() == EscrowStatus.HELD)
                .mapToLong(EscrowTransaction::getMentorPayout)
                .sum();

        long totalEarned = escrows.stream()
                .filter(e -> e.getStatus() == EscrowStatus.RELEASED)
                .mapToLong(EscrowTransaction::getMentorPayout)
                .sum();

        long totalCommissionPaid = escrows.stream()
                .filter(e -> e.getStatus() == EscrowStatus.RELEASED)
                .mapToLong(EscrowTransaction::getCommissionAmount)
                .sum();

        List<Booking> mentorBookings = bookingRepository.findByMentorId(mentorId);
        long completedSessions = mentorBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();
        long upcomingSessions = mentorBookings.stream()
                .filter(b -> UPCOMING_STATUSES.contains(b.getStatus()))
                .count();

        return new MentorEarningsResponse(
                mentor.getWalletBalance(),
                pendingClearance,
                totalEarned,
                totalCommissionPaid,
                completedSessions,
                upcomingSessions
        );
    }

    public BookingResponse getById(User user, String id) {
        return bookingMapper.toResponse(findOwned(user, id));
    }

    public BookingResponse cancel(User user, String id) {
        Booking booking = findOwned(user, id);
        String userId = user.getId();
        boolean isMentee = booking.getMenteeId().toHexString().equals(userId);
        boolean isMentor = booking.getMentorId().toHexString().equals(userId);
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            Query query = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                    .and("status").is(BookingStatus.PENDING_PAYMENT));
            Update update = new Update().set("status", BookingStatus.CANCELLED);
            Booking updated = mongoTemplate.findAndModify(query, update,
                    FindAndModifyOptions.options().returnNew(true), Booking.class);
            if (updated == null) {
                throw new BadRequestException("Buổi học không còn ở trạng thái chờ thanh toán hoặc đã được xử lý.");
            }
            return bookingMapper.toResponse(updated);
        }

        if (booking.getStatus() == BookingStatus.ESCROW_HELD || booking.getStatus() == BookingStatus.ACCEPTED) {
            if (isMentor || isAdmin) {
                // Mentor cancels -> 100% refund to mentee
                BookingResponse resp = escrowService.refundEscrowWithPenalty(booking, 1.0,
                        "Mentor đã hủy lịch booking #" + booking.getId() + ". Hoàn tiền 100% cho mentee.");

                // Increment mentor's cancel count
                if (isMentor) {
                    mongoTemplate.updateFirst(
                            new Query(Criteria.where("userId").is(booking.getMentorId())),
                            new Update().inc("mentorCancelCount", 1),
                            MentorProfile.class
                    );
                }

                User mentee = userRepository.findById(booking.getMenteeId().toHexString()).orElse(null);
                if (mentee != null) {
                    mailService.sendCancellationNotification(
                            mentee.getEmail(),
                            mentee.getFullName(),
                            user.getFullName(),
                            booking.getId(),
                            booking.getCourseCode(),
                            "Mentor đã hủy buổi học. Toàn bộ 100% học phí (" + booking.getPrice() + " VNĐ) đã được hoàn lại vào ví của bạn."
                    );
                }
                return resp;
            }

            if (isMentee) {
                Instant now = now();
                if (now.isAfter(booking.getStartAt())) {
                    throw new BadRequestException("Buổi học đã bắt đầu hoặc đã qua thời gian, không thể hủy. Vui lòng mở khiếu nại nếu có vấn đề.");
                }

                // If booking is ESCROW_HELD: Mentor has NOT accepted yet, no commitment made.
                // 100% full refund to mentee without penalty.
                if (booking.getStatus() == BookingStatus.ESCROW_HELD) {
                    BookingResponse resp = escrowService.refundEscrowWithPenalty(booking, 1.0,
                            "Học viên hủy lịch khi Mentor chưa nhận lớp. Hoàn tiền 100% cho mentee.");

                    User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
                    if (mentor != null) {
                        mailService.sendCancellationNotification(
                                mentor.getEmail(),
                                mentor.getFullName(),
                                user.getFullName(),
                                booking.getId(),
                                booking.getCourseCode(),
                                "Học viên đã hủy yêu cầu đặt lịch học khi chưa được chấp nhận (hoàn tiền 100% cho học viên)."
                        );
                    }
                    return resp;
                }

                // If booking is ACCEPTED: Mentor has accepted & reserved time
                long minutesUntilStart = Duration.between(now, booking.getStartAt()).toMinutes();
                if (minutesUntilStart >= 24 * 60) {
                    // >= 24h: 100% refund
                    BookingResponse resp = escrowService.refundEscrowWithPenalty(booking, 1.0,
                            "Hủy lịch trước 24h. Hoàn tiền 100% cho mentee.");

                    User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
                    if (mentor != null) {
                        mailService.sendCancellationNotification(
                                mentor.getEmail(),
                                mentor.getFullName(),
                                user.getFullName(),
                                booking.getId(),
                                booking.getCourseCode(),
                                "Học viên đã hủy lịch học trước 24h (hoàn tiền 100% cho học viên)."
                        );
                    }
                    return resp;
                } else if (minutesUntilStart >= 12 * 60) {
                    // 12h - 24h: 70% refund to mentee, 30% compensation to mentor (with 15% platform commission)
                    BookingResponse resp = escrowService.refundEscrowWithPenalty(booking, 0.70,
                            "Hủy lịch trong vòng 12h - 24h. Hoàn tiền 70% cho mentee, 30% bồi thường mentor.");

                    User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
                    if (mentor != null) {
                        mailService.sendCancellationNotification(
                                mentor.getEmail(),
                                mentor.getFullName(),
                                user.getFullName(),
                                booking.getId(),
                                booking.getCourseCode(),
                                "Học viên đã hủy lịch học trong vòng 12h - 24h. Bạn nhận được phí bồi thường 30% (sau khi trừ 15% hoa hồng sàn) vào ví."
                        );
                    }
                    return resp;
                } else {
                    // < 12h: cannot cancel directly
                    throw new BadRequestException("Không thể hủy buổi học trong vòng 12 giờ trước giờ bắt đầu. Vui lòng liên hệ trực tiếp mentor hoặc mở khiếu nại nếu gặp sự cố.");
                }
            }
        }

        throw new BadRequestException("Không thể hủy buổi học ở trạng thái " + booking.getStatus());
    }

    public BookingResponse reschedule(User user, String id, RescheduleRequest request) {
        Booking booking = findOwned(user, id);
        boolean isMentee = booking.getMenteeId().toHexString().equals(user.getId());
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (!isMentee && !isAdmin) {
            throw new AccessDeniedException("Chỉ học viên đặt lịch mới có quyền yêu cầu đổi lịch");
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT
                && booking.getStatus() != BookingStatus.ESCROW_HELD
                && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new BadRequestException("Chỉ có thể đổi lịch khi buổi học đang chờ thanh toán, đã ký quỹ hoặc đã chấp nhận (hiện tại: " + booking.getStatus() + ")");
        }

        if (booking.getRescheduleCount() >= 2) {
            throw new BadRequestException("Bạn đã sử dụng hết số lần đổi lịch (tối đa 2 lần cho mỗi buổi học).");
        }

        if (booking.getPendingStartAt() != null) {
            throw new BadRequestException("Buổi học đang có một yêu cầu đổi lịch chờ mentor phản hồi.");
        }

        Instant now = now();
        long minutesUntilStart = Duration.between(now, booking.getStartAt()).toMinutes();
        if (minutesUntilStart < 12 * 60) {
            throw new BadRequestException("Không thể đổi lịch trong vòng 12 giờ trước giờ học.");
        }

        Instant newStart = request.newStartAt();
        long minutesUntilNewStart = Duration.between(now, newStart).toMinutes();

        if (minutesUntilNewStart < 2 * 60) {
            throw new BadRequestException("Thời gian mới phải cách thời điểm hiện tại ít nhất 2 tiếng.");
        }
        if (minutesUntilNewStart > 30L * 24 * 60) {
            throw new BadRequestException("Thời gian mới không được vượt quá 30 ngày kể từ thời điểm hiện tại (tránh giam giữ tiền ký quỹ quá lâu).");
        }

        // Validate mentor availability if configured
        MentorProfile mentorProfile = mentorRepository.findByUserId(booking.getMentorId()).orElse(null);
        validateMentorAvailability(mentorProfile, newStart, booking.getDurationMin());

        // Lock on mentor to ensure concurrency-safe conflict validation and reschedule execution
        return distributedLockService.executeWithLock(
                "lock:mentor:" + booking.getMentorId().toHexString(),
                Duration.ofSeconds(5),
                Duration.ofSeconds(10),
                () -> {
                    // Validate schedule conflict for both mentor and mentee
                    validateNoScheduleConflict(booking, newStart, booking.getDurationMin());

                    // Free reschedule ONLY when BOTH old start time AND new start time are >= 24h away
                    boolean isFreeReschedule = (minutesUntilStart >= 24 * 60) && (minutesUntilNewStart >= 24 * 60);

                    // If not free (oldStart is 12h-24h OR newStart is short-notice 2h-24h): needs mentor approval
                    if (!isFreeReschedule) {
                        Query query = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                                .and("status").in(BookingStatus.PENDING_PAYMENT, BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED)
                                .and("pendingStartAt").isNull()
                                .and("rescheduleCount").lt(2));
                        Update update = new Update().set("pendingStartAt", newStart);
                        Booking saved = mongoTemplate.findAndModify(query, update,
                                FindAndModifyOptions.options().returnNew(true), Booking.class);

                        if (saved == null) {
                            throw new BadRequestException("Không thể gửi yêu cầu đổi lịch. Buổi học đã có yêu cầu khác hoặc trạng thái đã thay đổi.");
                        }
                        booking.setPendingStartAt(newStart);

                        User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
                        if (mentor != null) {
                            mailService.sendRescheduleRequestToMentor(
                                    mentor.getEmail(),
                                    mentor.getFullName(),
                                    user.getFullName(),
                                    booking.getId(),
                                    booking.getCourseCode(),
                                    booking.getStartAt(),
                                    newStart,
                                    booking.getDurationMin()
                            );
                        }
                        return bookingMapper.toResponse(saved);
                    }

                    // >= 24h: free reschedule
                    Instant oldStart = booking.getStartAt();
                    Query query = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                            .and("status").in(BookingStatus.PENDING_PAYMENT, BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED)
                            .and("pendingStartAt").isNull()
                            .and("rescheduleCount").lt(2));
                    Update update = new Update()
                            .set("rescheduledFrom", oldStart)
                            .set("startAt", newStart)
                            .inc("rescheduleCount", 1)
                            .set("pendingStartAt", null);
                    Booking saved = mongoTemplate.findAndModify(query, update,
                            FindAndModifyOptions.options().returnNew(true), Booking.class);

                    if (saved == null) {
                        throw new BadRequestException("Không thể đổi lịch. Buổi học đã có yêu cầu đổi lịch, đạt tối đa 2 lần hoặc trạng thái đã thay đổi.");
                    }
                    booking.setRescheduledFrom(oldStart);
                    booking.setStartAt(newStart);
                    booking.setRescheduleCount(booking.getRescheduleCount() + 1);
                    booking.setPendingStartAt(null);

                    User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
                    if (mentor != null) {
                        mailService.sendRescheduleNotificationToMentor(
                                mentor.getEmail(),
                                mentor.getFullName(),
                                user.getFullName(),
                                booking.getId(),
                                booking.getEffectiveRoomId(),
                                booking.getCourseCode(),
                                oldStart,
                                newStart,
                                booking.getDurationMin()
                        );
                    }
                    return bookingMapper.toResponse(saved);
                }
        );
    }

    public BookingResponse respondReschedule(User user, String id, RescheduleRespondRequest request) {
        Booking booking = findOwned(user, id);
        boolean isMentor = booking.getMentorId().toHexString().equals(user.getId());
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (!isMentor && !isAdmin) {
            throw new AccessDeniedException("Chỉ mentor của buổi học mới có quyền phản hồi yêu cầu đổi lịch.");
        }

        if (booking.getPendingStartAt() == null) {
            throw new BadRequestException("Buổi học hiện không có yêu cầu đổi lịch nào chờ phản hồi.");
        }

        User mentee = userRepository.findById(booking.getMenteeId().toHexString()).orElse(null);

        // Lock on mentor to ensure concurrency safety
        return distributedLockService.executeWithLock(
                "lock:mentor:" + booking.getMentorId().toHexString(),
                Duration.ofSeconds(5),
                Duration.ofSeconds(10),
                () -> {
                    if (Boolean.FALSE.equals(request.accept())) {
                        Query query = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                                .and("mentorId").is(booking.getMentorId())
                                .and("pendingStartAt").ne(null));
                        Update update = new Update().set("pendingStartAt", null);
                        Booking saved = mongoTemplate.findAndModify(query, update,
                                FindAndModifyOptions.options().returnNew(true), Booking.class);

                        if (saved == null) {
                            throw new BadRequestException("Yêu cầu đổi lịch không tồn tại hoặc đã được xử lý.");
                        }
                        booking.setPendingStartAt(null);

                        if (mentee != null) {
                            mailService.sendRescheduleResponseToMentee(
                                    mentee.getEmail(),
                                    mentee.getFullName(),
                                    user.getFullName(),
                                    booking.getId(),
                                    booking.getCourseCode(),
                                    false,
                                    booking.getStartAt(),
                                    booking.getStartAt(),
                                    booking.getDurationMin()
                            );
                        }
                        return bookingMapper.toResponse(saved);
                    }

                    // Mentor accepted:
                    if (booking.getRescheduleCount() >= 2) {
                        throw new BadRequestException("Buổi học này đã đạt giới hạn tối đa 2 lần đổi lịch.");
                    }

                    Instant newStart = booking.getPendingStartAt();
                    // Double-check schedule conflict for both mentor and mentee
                    validateNoScheduleConflict(booking, newStart, booking.getDurationMin());

                    Instant oldStart = booking.getStartAt();
                    Query query = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                            .and("mentorId").is(booking.getMentorId())
                            .and("pendingStartAt").ne(null)
                            .and("rescheduleCount").lt(2));
                    Update update = new Update()
                            .set("rescheduledFrom", oldStart)
                            .set("startAt", newStart)
                            .set("pendingStartAt", null)
                            .inc("rescheduleCount", 1);
                    Booking saved = mongoTemplate.findAndModify(query, update,
                            FindAndModifyOptions.options().returnNew(true), Booking.class);

                    if (saved == null) {
                        throw new BadRequestException("Yêu cầu đổi lịch không tồn tại hoặc đã đạt tối đa số lần đổi lịch.");
                    }
                    booking.setRescheduledFrom(oldStart);
                    booking.setStartAt(newStart);
                    booking.setPendingStartAt(null);
                    booking.setRescheduleCount(booking.getRescheduleCount() + 1);

                    if (mentee != null) {
                        mailService.sendRescheduleResponseToMentee(
                                mentee.getEmail(),
                                mentee.getFullName(),
                                user.getFullName(),
                                booking.getId(),
                                booking.getCourseCode(),
                                true,
                                oldStart,
                                newStart,
                                booking.getDurationMin()
                        );
                    }
                    return bookingMapper.toResponse(saved);
                }
        );
    }

    private void validateNoScheduleConflict(Booking booking, Instant targetStart, int durationMin) {
        Instant targetEnd = targetStart.plus(durationMin, ChronoUnit.MINUTES);
        Instant now = now();

        // Check for time overlap in mentor's schedule (excluding current booking, including active PENDING_PAYMENT)
        List<Booking> activeMentorBookings = bookingRepository.findByMentorIdAndStatusIn(
                booking.getMentorId(),
                CONFLICT_CHECK_STATUSES
        );
        boolean mentorConflict = activeMentorBookings.stream()
                .filter(b -> !b.getId().equals(booking.getId()))
                .anyMatch(b -> {
                    if (isExpiredPendingPayment(b, now)) {
                        return false;
                    }
                    Instant existingStart = b.getStartAt();
                    Instant existingEnd = existingStart.plus(b.getDurationMin(), ChronoUnit.MINUTES);
                    return targetStart.isBefore(existingEnd) && targetEnd.isAfter(existingStart);
                });
        if (mentorConflict) {
            throw new BadRequestException("Mentor đã có lịch dạy khác trong khung giờ này. Vui lòng chọn khung giờ khác.");
        }

        // Check for time overlap in mentee's personal schedule (excluding current booking, including active PENDING_PAYMENT)
        List<Booking> activeMenteeBookings = bookingRepository.findByMenteeIdAndStatusIn(
                booking.getMenteeId(),
                CONFLICT_CHECK_STATUSES
        );
        boolean menteeConflict = activeMenteeBookings.stream()
                .filter(b -> !b.getId().equals(booking.getId()))
                .anyMatch(b -> {
                    if (isExpiredPendingPayment(b, now)) {
                        return false;
                    }
                    Instant existingStart = b.getStartAt();
                    Instant existingEnd = existingStart.plus(b.getDurationMin(), ChronoUnit.MINUTES);
                    return targetStart.isBefore(existingEnd) && targetEnd.isAfter(existingStart);
                });
        if (menteeConflict) {
            throw new BadRequestException("Bạn đã có một buổi học khác trong khung giờ này. Vui lòng kiểm tra lại lịch học của bạn.");
        }
    }

    private boolean isExpiredPendingPayment(Booking b, Instant now) {
        return b.getStatus() == BookingStatus.PENDING_PAYMENT
                && b.getCreatedAt() != null
                && b.getCreatedAt().isBefore(now.minus(30, ChronoUnit.MINUTES));
    }

    public void validateMentorAvailability(MentorProfile mentorProfile, Instant targetStart, int durationMin) {
        if (mentorProfile == null || mentorProfile.getAvailability() == null || mentorProfile.getAvailability().isEmpty()) {
            return;
        }
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime zdtStart = targetStart.atZone(zone);
        ZonedDateTime zdtEnd = targetStart.plus(durationMin, ChronoUnit.MINUTES).atZone(zone);

        if (!zdtStart.toLocalDate().equals(zdtEnd.toLocalDate())
                && !(zdtEnd.toLocalDate().equals(zdtStart.toLocalDate().plusDays(1)) && zdtEnd.getHour() == 0 && zdtEnd.getMinute() == 0)) {
            throw new BadRequestException("Buổi học không được kéo dài qua ngày hôm sau.");
        }

        String dayFullName = zdtStart.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH); // e.g. "Monday"
        String dayShortName = zdtStart.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH); // e.g. "Mon"

        List<String> availableSlots = null;
        for (Map.Entry<String, List<String>> entry : mentorProfile.getAvailability().entrySet()) {
            if (entry.getKey().equalsIgnoreCase(dayFullName) || entry.getKey().equalsIgnoreCase(dayShortName)) {
                availableSlots = entry.getValue();
                break;
            }
        }

        if (availableSlots == null || availableSlots.isEmpty()) {
            throw new BadRequestException("Mentor không có lịch rảnh vào ngày " + dayFullName + ".");
        }

        int startTotalMin = zdtStart.getHour() * 60 + zdtStart.getMinute();
        int endTotalMin = startTotalMin + durationMin;
        int firstHour = startTotalMin / 60;
        int lastHour = (endTotalMin - 1) / 60;

        for (int h = firstHour; h <= lastHour; h++) {
            String hourSlot = String.format("%02d:00", h);
            String prefix = String.format("%02d:", h);
            boolean match = availableSlots.contains(hourSlot) || availableSlots.stream().anyMatch(s -> s.startsWith(prefix));
            if (!match) {
                if (h == firstHour) {
                    throw new BadRequestException("Khung giờ " + String.format("%02d:%02d", zdtStart.getHour(), zdtStart.getMinute())
                            + " ngày " + dayFullName + " không nằm trong lịch rảnh đã đăng ký của Mentor.");
                } else {
                    throw new BadRequestException("Buổi học kéo dài đến " + String.format("%02d:%02d", zdtEnd.getHour(), zdtEnd.getMinute())
                            + ", vượt quá khung giờ rảnh của Mentor (khung " + hourSlot + " không có sẵn).");
                }
            }
        }
    }

    // price = hourly_rate * durationMin / 60, rounded up to nearest unit
    private long calculatePrice(Course course, BookingFormat format, int durationMin) {
        long hourlyRate = format == BookingFormat.ONE_ON_ONE
                ? course.getRatePrivate()
                : course.getRateGroup();
        return (long) Math.ceil((double) hourlyRate * durationMin / 60);
    }

    private Booking findOwned(User user, String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));

        String userId = user.getId();
        boolean isParticipant = booking.getMenteeId().toHexString().equals(userId)
                || booking.getMentorId().toHexString().equals(userId);
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (!isParticipant && !isAdmin) {
            throw new AccessDeniedException("You do not have access to this booking");
        }

        return booking;
    }
}
