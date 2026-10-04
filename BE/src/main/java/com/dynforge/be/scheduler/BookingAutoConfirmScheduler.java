package com.dynforge.be.scheduler;

import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.Recording;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.RecordingRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.service.EscrowService;
import com.dynforge.be.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
public class BookingAutoConfirmScheduler {

    private final BookingRepository bookingRepository;
    private final EscrowService escrowService;
    private final MongoTemplate mongoTemplate;
    private final RecordingRepository recordingRepository;
    private final UserRepository userRepository;
    private final MailService mailService;
    private Clock clock;

    @Autowired
    public BookingAutoConfirmScheduler(BookingRepository bookingRepository,
                                       EscrowService escrowService,
                                       MongoTemplate mongoTemplate,
                                       RecordingRepository recordingRepository,
                                       UserRepository userRepository,
                                       MailService mailService,
                                       Clock clock) {
        this.bookingRepository = bookingRepository;
        this.escrowService = escrowService;
        this.mongoTemplate = mongoTemplate;
        this.recordingRepository = recordingRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public BookingAutoConfirmScheduler(BookingRepository bookingRepository,
                                       EscrowService escrowService,
                                       MongoTemplate mongoTemplate,
                                       RecordingRepository recordingRepository,
                                       UserRepository userRepository,
                                       MailService mailService) {
        this(bookingRepository, escrowService, mongoTemplate, recordingRepository, userRepository, mailService, Clock.systemUTC());
    }

    public Instant now() {
        return clock != null ? clock.instant() : Instant.now();
    }

    public void setClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    @Scheduled(fixedRate = 3_600_000) // every hour
    @SchedulerLock(name = "autoConfirmStaleTaughtBookings", lockAtMostFor = "30m", lockAtLeastFor = "1m")
    public void autoConfirmStaleTaughtBookings() {
        Instant cutoff = now().minus(24, ChronoUnit.HOURS);
        List<Booking> stale = bookingRepository.findByStatusAndTaughtAtBefore(BookingStatus.TAUGHT, cutoff);

        if (!stale.isEmpty()) {
            log.info("Auto-confirm scheduler: found {} stale TAUGHT booking(s)", stale.size());
        }

        for (Booking booking : stale) {
            escrowService.autoConfirm(booking.getId());
        }
    }

    /**
     * 1. Timeout for unpaid bookings: auto-cancel PENDING_PAYMENT older than 30 minutes.
     */
    @Scheduled(fixedRate = 600_000) // every 10 minutes
    @SchedulerLock(name = "autoCancelUnpaidBookings", lockAtMostFor = "5m", lockAtLeastFor = "30s")
    public void autoCancelUnpaidBookings() {
        Instant cutoff = now().minus(30, ChronoUnit.MINUTES);
        List<Booking> unpaid = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.PENDING_PAYMENT, cutoff);

        for (Booking b : unpaid) {
            Query q = new Query(Criteria.where("_id").is(new ObjectId(b.getId()))
                    .and("status").is(BookingStatus.PENDING_PAYMENT));
            Update u = new Update().set("status", BookingStatus.CANCELLED);
            Booking updated = mongoTemplate.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), Booking.class);
            if (updated != null) {
                log.info("Auto-cancelled unpaid booking #{} created at {}", b.getId(), b.getCreatedAt());
            }
        }
    }

    /**
     * 2. Timeout for unaccepted bookings: if mentor hasn't accepted within 24h of payment
     * or start time is less than 2 hours away, auto-refund escrow to mentee.
     */
    @Scheduled(fixedRate = 900_000) // every 15 minutes
    @SchedulerLock(name = "autoRefundUnacceptedBookings", lockAtMostFor = "10m", lockAtLeastFor = "1m")
    public void autoRefundUnacceptedBookings() {
        List<Booking> held = bookingRepository.findByStatus(BookingStatus.ESCROW_HELD);
        Instant now = now();
        Instant cutoff24h = now.minus(24, ChronoUnit.HOURS);
        Instant cutoffNearStart = now.plus(2, ChronoUnit.HOURS);

        for (Booking b : held) {
            boolean expired24h = b.getCreatedAt() != null && b.getCreatedAt().isBefore(cutoff24h);
            boolean nearStart = b.getStartAt() != null && b.getStartAt().isBefore(cutoffNearStart);

            if (expired24h || nearStart) {
                String reason = expired24h
                        ? "Mentor không phản hồi yêu cầu đặt lịch trong vòng 24 giờ."
                        : "Sắp đến giờ học nhưng Mentor chưa phản hồi chấp nhận.";
                log.info("Auto-refunding unaccepted booking #{}: {}", b.getId(), reason);
                escrowService.autoRefundBySystem(b.getId(), reason);
            }
        }
    }

    /**
     * 3. Send email reminders to Mentor after session ends if not yet mark-taught.
     * - Reminder after 2 hours
     * - Warning after 12 hours (before reaching 24h auto-refund threshold)
     */
    @Scheduled(fixedRate = 900_000) // every 15 minutes
    @SchedulerLock(name = "sendPostSessionMarkTaughtReminders", lockAtMostFor = "10m", lockAtLeastFor = "1m")
    public void sendPostSessionMarkTaughtReminders() {
        List<Booking> accepted = bookingRepository.findByStatus(BookingStatus.ACCEPTED);
        Instant now = now();

        for (Booking b : accepted) {
            if (b.getStartAt() == null) continue;
            Instant sessionEnd = b.getStartAt().plus(b.getDurationMin(), ChronoUnit.MINUTES);
            if (now.isBefore(sessionEnd)) continue;

            Duration durationPastEnd = Duration.between(sessionEnd, now);
            long hoursPast = durationPastEnd.toHours();

            // 1. Warning after 12 hours (if >= 12h and < 24h and reminder12hSent is false)
            if (hoursPast >= 12 && hoursPast < 24 && !b.isReminder12hSent()) {
                Query q = new Query(Criteria.where("_id").is(new ObjectId(b.getId()))
                        .and("status").is(BookingStatus.ACCEPTED)
                        .and("reminder12hSent").is(false));
                Update u = new Update().set("reminder12hSent", true);
                Booking updated = mongoTemplate.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), Booking.class);
                if (updated != null) {
                    sendReminderEmail(b, 12);
                }
            }
            // 2. Reminder after 2 hours (if >= 2h and < 12h and reminder2hSent is false)
            else if (hoursPast >= 2 && hoursPast < 12 && !b.isReminder2hSent()) {
                Query q = new Query(Criteria.where("_id").is(new ObjectId(b.getId()))
                        .and("status").is(BookingStatus.ACCEPTED)
                        .and("reminder2hSent").is(false));
                Update u = new Update().set("reminder2hSent", true);
                Booking updated = mongoTemplate.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), Booking.class);
                if (updated != null) {
                    sendReminderEmail(b, 2);
                }
            }
        }
    }

    /**
     * 4. Safe Timeout for No-Show: if a booking was ACCEPTED, but 24 hours have passed since
     * the session ended and mentor never clicked mark-taught:
     * - Check if there is any Recording for this booking.
     *   - If Recording exists: DO NOT auto-refund. Switch booking to DISPUTED for Admin review.
     *   - If NO Recording exists: auto-refund mentee and increment mentorNoShowCount in MentorProfile.
     */
    @Scheduled(fixedRate = 3_600_000) // every hour
    @SchedulerLock(name = "autoRefundNoShowBookings", lockAtMostFor = "30m", lockAtLeastFor = "1m")
    public void autoRefundNoShowBookings() {
        List<Booking> accepted = bookingRepository.findByStatus(BookingStatus.ACCEPTED);
        Instant now = now();

        for (Booking b : accepted) {
            if (b.getStartAt() == null) continue;
            Instant sessionEnd = b.getStartAt().plus(b.getDurationMin(), ChronoUnit.MINUTES);
            Instant noShowCutoff = sessionEnd.plus(24, ChronoUnit.HOURS);

            if (now.isAfter(noShowCutoff)) {
                // Check if any recording exists for this booking
                List<Recording> recordings = recordingRepository.findByBookingIdOrderByCreatedAtDesc(new ObjectId(b.getId()));
                boolean hasRecording = recordings != null && !recordings.isEmpty();

                if (hasRecording) {
                    // Recording exists -> DO NOT auto-refund! Shift to DISPUTED for Admin review
                    Query q = new Query(Criteria.where("_id").is(new ObjectId(b.getId()))
                            .and("status").is(BookingStatus.ACCEPTED));
                    Update u = new Update()
                            .set("status", BookingStatus.DISPUTED)
                            .set("disputeIssueType", "RECORDING_REVIEW")
                            .set("disputeReason", "Buổi học đã kết thúc hơn 24 giờ và mentor chưa bấm xác nhận đã dạy (mark-taught), nhưng hệ thống phát hiện ĐÃ CÓ video Recording. Tạm dừng hoàn tiền tự động và chuyển sang tranh chấp để Admin đối soát video.");
                    Booking updated = mongoTemplate.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), Booking.class);
                    if (updated != null) {
                        log.warn("Booking #{} has recording present. Shifted to DISPUTED for Admin review instead of auto-refund.", b.getId());
                    }
                } else {
                    // No recording -> auto-refund mentee
                    log.info("Auto-refunding no-show booking #{}: Mentor did not mark taught after 24h past session end and no recording found", b.getId());
                    escrowService.autoRefundBySystem(b.getId(), "Mentor vắng mặt không xác nhận buổi dạy (No-show). Tiền đã được tự động hoàn trả.");

                    // Increment mentorNoShowCount
                    mongoTemplate.updateFirst(
                            new Query(Criteria.where("userId").is(b.getMentorId())),
                            new Update().inc("mentorNoShowCount", 1),
                            MentorProfile.class
                    );
                }
            }
        }
    }

    private void sendReminderEmail(Booking b, int hoursElapsed) {
        User mentor = userRepository.findById(b.getMentorId().toHexString()).orElse(null);
        if (mentor != null && mentor.getEmail() != null) {
            mailService.sendMentorMarkTaughtReminder(
                    mentor.getEmail(),
                    mentor.getFullName(),
                    b.getId(),
                    b.getCourseCode(),
                    hoursElapsed
            );
        }
    }
}
