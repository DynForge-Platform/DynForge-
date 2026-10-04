package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingResponse;
import com.dynforge.be.util.UrlValidator;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.entity.WalletTransaction;
import com.dynforge.be.model.entity.Course;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.model.enums.TransactionStatus;
import com.dynforge.be.model.enums.TransactionType;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.EscrowTransactionRepository;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
public class EscrowService {

    private final BookingRepository bookingRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final WalletTransactionRepository walletTxnRepository;
    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final BookingMapper bookingMapper;
    private final MailService mailService;
    private final MongoTemplate mongoTemplate;
    private Clock clock;

    @Autowired
    public EscrowService(BookingRepository bookingRepository,
                         EscrowTransactionRepository escrowRepository,
                         WalletTransactionRepository walletTxnRepository,
                         UserRepository userRepository,
                         MentorRepository mentorRepository,
                         BookingMapper bookingMapper,
                         MailService mailService,
                         MongoTemplate mongoTemplate,
                         Clock clock) {
        this.bookingRepository = bookingRepository;
        this.escrowRepository = escrowRepository;
        this.walletTxnRepository = walletTxnRepository;
        this.userRepository = userRepository;
        this.mentorRepository = mentorRepository;
        this.bookingMapper = bookingMapper;
        this.mailService = mailService;
        this.mongoTemplate = mongoTemplate;
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    public EscrowService(BookingRepository bookingRepository,
                         EscrowTransactionRepository escrowRepository,
                         WalletTransactionRepository walletTxnRepository,
                         UserRepository userRepository,
                         MentorRepository mentorRepository,
                         BookingMapper bookingMapper,
                         MailService mailService,
                         MongoTemplate mongoTemplate) {
        this(bookingRepository, escrowRepository, walletTxnRepository, userRepository, mentorRepository, bookingMapper, mailService, mongoTemplate, Clock.systemUTC());
    }

    public Instant now() {
        return clock != null ? clock.instant() : Instant.now();
    }

    public void setClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.systemUTC();
    }

    // ── pay ──────────────────────────────────────────────────────────────────

    public BookingResponse pay(User mentee, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee can pay for this booking");
        }
        requireStatus(booking, BookingStatus.PENDING_PAYMENT);

        if (mentee.getWalletBalance() < booking.getPrice()) {
            throw new BadRequestException(
                    "Insufficient wallet balance. Required: " + booking.getPrice()
                            + ", available: " + mentee.getWalletBalance());
        }

        long total      = booking.getPrice();
        double rate     = booking.getCommissionRate();
        long commission = Math.round(total * rate);
        long payout     = total - commission;

        // Atomic wallet deduction (prevents race condition)
        Query debitQuery = new Query(Criteria.where("_id").is(new ObjectId(mentee.getId()))
                .and("walletBalance").gte(total));
        Update debitUpdate = new Update().inc("walletBalance", -total);
        User updatedMentee = mongoTemplate.findAndModify(debitQuery, debitUpdate,
                FindAndModifyOptions.options().returnNew(true), User.class);

        if (updatedMentee == null) {
            throw new BadRequestException("Số dư ví không đủ hoặc tài khoản đang bận xử lý giao dịch khác.");
        }

        EscrowTransaction escrow;
        Booking savedBooking;
        try {
            recordWalletTxn(mentee.getId(), TransactionType.PAYMENT, total,
                    "Payment for booking " + bookingId, bookingId);

            escrow = escrowRepository.save(EscrowTransaction.builder()
                    .bookingId(new ObjectId(bookingId))
                    .menteeId(new ObjectId(mentee.getId()))
                    .mentorId(booking.getMentorId())
                    .totalAmount(total)
                    .commissionRate(rate)
                    .commissionAmount(commission)
                    .mentorPayout(payout)
                    .status(EscrowStatus.HELD)
                    .heldAt(now())
                    .build());

            // Conditional update on Booking: WHERE status = PENDING_PAYMENT
            Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                    .and("status").is(BookingStatus.PENDING_PAYMENT));
            Update bookingUpdate = new Update()
                    .set("status", BookingStatus.ESCROW_HELD)
                    .set("escrowTxnId", new ObjectId(escrow.getId()));
            savedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                    FindAndModifyOptions.options().returnNew(true), Booking.class);

            if (savedBooking == null) {
                // Booking was concurrently cancelled or timed out
                escrowRepository.deleteById(escrow.getId());
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("_id").is(new ObjectId(mentee.getId()))),
                        new Update().inc("walletBalance", total),
                        User.class
                );
                throw new BadRequestException("Buổi học không còn ở trạng thái chờ thanh toán hoặc đã bị hủy.");
            }
        } catch (Exception ex) {
            // Compensating rollback on standalone MongoDB
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(new ObjectId(mentee.getId()))),
                    new Update().inc("walletBalance", total),
                    User.class
            );
            log.error("Failed to complete escrow payment for booking {}, compensated wallet: {}", bookingId, ex.getMessage());
            throw new BadRequestException("Không thể hoàn tất ký quỹ: " + ex.getMessage());
        }

        // Send booking confirmation email asynchronously to mentee
        sendPaymentSuccessEmail(mentee, savedBooking);

        return bookingMapper.toResponse(savedBooking);
    }

    // ── accept request (mentor) ──────────────────────────────────────────────

    public BookingResponse accept(User mentor, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMentorId().toHexString().equals(mentor.getId())) {
            throw new BadRequestException("Only the mentor can accept this booking");
        }

        // Conditional update: WHERE status = ESCROW_HELD
        Query query = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("mentorId").is(new ObjectId(mentor.getId()))
                .and("status").is(BookingStatus.ESCROW_HELD));
        Update update = new Update()
                .set("status", BookingStatus.ACCEPTED)
                .set("acceptedAt", now());
        Booking updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updated == null) {
            throw new BadRequestException("Không thể chấp nhận buổi học. Buổi học không ở trạng thái chờ chấp nhận hoặc đã được xử lý.");
        }
        return bookingMapper.toResponse(updated);
    }

    // ── decline request (mentor) → refund mentee ─────────────────────────────

    public BookingResponse decline(User mentor, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMentorId().toHexString().equals(mentor.getId())) {
            throw new BadRequestException("Only the mentor can decline this booking");
        }

        return refundEscrow(booking);
    }

    // ── mark-taught (mentor) ─────────────────────────────────────────────────

    public BookingResponse markTaught(User mentor, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMentorId().toHexString().equals(mentor.getId())) {
            throw new BadRequestException("Only the mentor can mark this session as taught");
        }

        // Conditional update: WHERE status in [ESCROW_HELD, ACCEPTED]
        Query query = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("mentorId").is(new ObjectId(mentor.getId()))
                .and("status").in(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED));
        Update update = new Update()
                .set("status", BookingStatus.TAUGHT)
                .set("taughtAt", now());
        Booking updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updated == null) {
            throw new BadRequestException("Không thể đánh dấu đã dạy. Buổi học không ở trạng thái hợp lệ hoặc đã hoàn tất/hủy/khiếu nại.");
        }
        return bookingMapper.toResponse(updated);
    }

    // ── confirm (mentee) → COMPLETED + release ───────────────────────────────

    public BookingResponse confirmAndRelease(User mentee, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee can confirm this booking");
        }

        return releaseEscrow(booking);
    }

    // ── dispute (mentee) ─────────────────────────────────────────────────────

    public BookingResponse dispute(User mentee, String bookingId, String issueType, String reason) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee can open a dispute");
        }

        // Must be at least 15 minutes after session start time
        Instant allowedDisputeTime = booking.getStartAt().plus(15, ChronoUnit.MINUTES);
        if (now().isBefore(allowedDisputeTime)) {
            String timeStr = DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy")
                    .withZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .format(allowedDisputeTime);
            throw new BadRequestException("Chỉ có thể mở khiếu nại sau khi buổi học đã bắt đầu ít nhất 15 phút (từ "
                    + timeStr + " GMT+7). Trước thời điểm này, vui lòng sử dụng tính năng Đổi lịch hoặc Hủy lịch theo chính sách của nền tảng.");
        }

        // Conditional update: WHERE status in [ESCROW_HELD, ACCEPTED, TAUGHT]
        Query query = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("menteeId").is(new ObjectId(mentee.getId()))
                .and("status").in(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED, BookingStatus.TAUGHT));
        Update update = new Update()
                .set("status", BookingStatus.DISPUTED)
                .set("disputeIssueType", issueType)
                .set("disputeReason", reason);
        Booking updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updated == null) {
            throw new BadRequestException("Không thể mở khiếu nại. Buổi học đã hoàn thành, bị hủy hoặc đang được xử lý.");
        }
        return bookingMapper.toResponse(updated);
    }

    // ── respond to dispute (mentor) ──────────────────────────────────────────

    public BookingResponse respondDispute(User mentor, String bookingId, String response, String evidenceUrl) {
        UrlValidator.validateHttpUrl(evidenceUrl, "disputeMentorEvidenceUrl");

        Booking booking = requireBooking(bookingId);

        if (!booking.getMentorId().toHexString().equals(mentor.getId())) {
            throw new BadRequestException("Chỉ mentor của buổi học này mới có quyền phản hồi khiếu nại");
        }

        // Conditional update: WHERE status = DISPUTED
        Query query = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("mentorId").is(new ObjectId(mentor.getId()))
                .and("status").is(BookingStatus.DISPUTED));
        Update update = new Update()
                .set("disputeMentorResponse", response)
                .set("disputeMentorEvidenceUrl", evidenceUrl)
                .set("disputeRespondedAt", now());
        Booking updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updated == null) {
            throw new BadRequestException("Khiếu nại không ở trạng thái chờ phản hồi hoặc buổi học không hợp lệ.");
        }
        return bookingMapper.toResponse(updated);
    }

    // ── resolve dispute (admin) ───────────────────────────────────────────────

    public BookingResponse resolveDispute(String bookingId, boolean releaseToMentor) {
        Booking booking = requireBooking(bookingId);
        requireStatus(booking, BookingStatus.DISPUTED);

        if (releaseToMentor) {
            // Conditional update on Booking: DISPUTED -> COMPLETED
            Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                    .and("status").is(BookingStatus.DISPUTED));
            Update bookingUpdate = new Update().set("status", BookingStatus.COMPLETED);
            Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                    FindAndModifyOptions.options().returnNew(true), Booking.class);

            if (updatedBooking == null) {
                throw new BadRequestException("Khiếu nại này đã được xử lý hoặc buổi học không ở trạng thái khiếu nại.");
            }

            // Conditional update on Escrow: HELD -> RELEASED
            Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(bookingId))
                    .and("status").is(EscrowStatus.HELD));
            Update escrowUpdate = new Update()
                    .set("status", EscrowStatus.RELEASED)
                    .set("releasedAt", now());
            EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                    FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

            if (updatedEscrow == null) {
                log.warn("Resolve dispute: Escrow for booking {} was not in HELD state. Wallet balance untouched.", bookingId);
                throw new BadRequestException("Giao dịch ký quỹ không ở trạng thái tạm giữ (HELD) hoặc đã được xử lý.");
            }

            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(updatedEscrow.getMentorId())),
                    new Update().inc("walletBalance", updatedEscrow.getMentorPayout()),
                    User.class
            );
            recordWalletTxn(updatedEscrow.getMentorId().toHexString(), TransactionType.PAYOUT, updatedEscrow.getMentorPayout(),
                    "Payout for resolved dispute on booking " + bookingId, bookingId);

            return bookingMapper.toResponse(updatedBooking);
        } else {
            // Conditional update on Booking: DISPUTED -> REFUNDED
            Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                    .and("status").is(BookingStatus.DISPUTED));
            Update bookingUpdate = new Update().set("status", BookingStatus.REFUNDED);
            Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                    FindAndModifyOptions.options().returnNew(true), Booking.class);

            if (updatedBooking == null) {
                throw new BadRequestException("Khiếu nại này đã được xử lý hoặc buổi học không ở trạng thái khiếu nại.");
            }

            // Conditional update on Escrow: HELD -> REFUNDED
            Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(bookingId))
                    .and("status").is(EscrowStatus.HELD));
            Update escrowUpdate = new Update()
                    .set("status", EscrowStatus.REFUNDED)
                    .set("releasedAt", now());
            EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                    FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

            if (updatedEscrow == null) {
                log.warn("Resolve dispute: Escrow for booking {} was not in HELD state. Wallet balance untouched.", bookingId);
                throw new BadRequestException("Giao dịch ký quỹ không ở trạng thái tạm giữ (HELD) hoặc đã được xử lý.");
            }

            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(updatedEscrow.getMenteeId())),
                    new Update().inc("walletBalance", updatedEscrow.getTotalAmount()),
                    User.class
            );
            recordWalletTxn(updatedEscrow.getMenteeId().toHexString(), TransactionType.REFUND, updatedEscrow.getTotalAmount(),
                    "Refund for resolved dispute on booking " + bookingId, bookingId);

            return bookingMapper.toResponse(updatedBooking);
        }
    }

    // ── refund escrow with penalty/compensation ───────────────────────────────

    public BookingResponse refundEscrowWithPenalty(Booking booking, double menteeRefundRatio, String reason) {
        // 1. Conditional update on Booking: WHERE status in [ESCROW_HELD, ACCEPTED]
        Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                .and("status").in(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED));
        Update bookingUpdate = new Update().set("status", BookingStatus.CANCELLED);
        Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updatedBooking == null) {
            throw new BadRequestException("Không thể hủy buổi học. Buổi học không ở trạng thái hợp lệ hoặc đã được xử lý.");
        }

        // 2. Conditional update on EscrowTransaction: WHERE status = HELD
        Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(booking.getId()))
                .and("status").is(EscrowStatus.HELD));
        Update escrowUpdate = new Update()
                .set("status", EscrowStatus.REFUNDED)
                .set("releasedAt", now());
        EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

        if (updatedEscrow == null) {
            log.warn("Escrow for booking {} was not in HELD state. Cancellation refund aborted, wallets untouched.", booking.getId());
            throw new BadRequestException("Giao dịch ký quỹ không ở trạng thái tạm giữ (HELD) hoặc đã được hoàn trả/giải ngân.");
        }

        long total = updatedEscrow.getTotalAmount();
        long menteeRefund = (long) Math.floor(total * menteeRefundRatio);
        long penaltyGross = total - menteeRefund;

        if (menteeRefund > 0) {
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(updatedEscrow.getMenteeId())),
                    new Update().inc("walletBalance", menteeRefund),
                    User.class
            );
            recordWalletTxn(updatedEscrow.getMenteeId().toHexString(), TransactionType.REFUND, menteeRefund,
                    reason != null ? reason : ("Hoàn tiền booking #" + booking.getId()), booking.getId());
        }

        if (penaltyGross > 0) {
            // "Mặc định áp hoa hồng 15% lên phần 30% đền bù cho Mentor"
            double commissionRate = booking.getCommissionRate() > 0 ? booking.getCommissionRate() : 0.15;
            long commissionAmount = Math.round(penaltyGross * commissionRate);
            long netMentorPayout = penaltyGross - commissionAmount;

            if (netMentorPayout > 0) {
                mongoTemplate.updateFirst(
                        new Query(Criteria.where("_id").is(updatedEscrow.getMentorId())),
                        new Update().inc("walletBalance", netMentorPayout),
                        User.class
                );
                recordWalletTxn(updatedEscrow.getMentorId().toHexString(), TransactionType.PAYOUT, netMentorPayout,
                        "Phí bồi thường hủy lịch (" + (int)((1 - menteeRefundRatio) * 100) + "% trừ 15% hoa hồng) booking #" + booking.getId(), booking.getId());
            }

            if (commissionAmount > 0) {
                recordWalletTxn(updatedEscrow.getMentorId().toHexString(), TransactionType.COMMISSION, commissionAmount,
                        "Hoa hồng sàn 15% trên tiền bồi thường hủy lịch booking #" + booking.getId(), booking.getId());
            }
        }

        return bookingMapper.toResponse(updatedBooking);
    }

    // ── auto-confirm (called by scheduler) ───────────────────────────────────

    public void autoConfirm(String bookingId) {
        // 1. Conditional update on Booking: TAUGHT -> COMPLETED
        Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("status").is(BookingStatus.TAUGHT));
        Update bookingUpdate = new Update().set("status", BookingStatus.COMPLETED);
        Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updatedBooking == null) {
            // Booking was disputed, cancelled, or already confirmed
            return;
        }

        // 2. Conditional update on Escrow: HELD -> RELEASED
        Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(bookingId))
                .and("status").is(EscrowStatus.HELD));
        Update escrowUpdate = new Update()
                .set("status", EscrowStatus.RELEASED)
                .set("releasedAt", now());
        EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

        if (updatedEscrow == null) {
            log.warn("Auto-confirm: Escrow for booking {} was not in HELD state. Mentor wallet balance untouched.", bookingId);
            return;
        }

        // 3. Credit wallet
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(updatedEscrow.getMentorId())),
                new Update().inc("walletBalance", updatedEscrow.getMentorPayout()),
                User.class
        );
        recordWalletTxn(updatedEscrow.getMentorId().toHexString(), TransactionType.PAYOUT, updatedEscrow.getMentorPayout(),
                "Payout for booking " + bookingId, bookingId);
        log.info("Auto-confirmed booking {}", bookingId);
    }

    /**
     * System auto-refund triggered by timeout schedulers (e.g. mentor declined by timeout or no-show).
     */
    public void autoRefundBySystem(String bookingId, String reason) {
        // 1. Conditional update on Booking: WHERE status in [ESCROW_HELD, ACCEPTED]
        Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(bookingId))
                .and("status").in(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED));
        Update bookingUpdate = new Update().set("status", BookingStatus.REFUNDED);
        Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updatedBooking == null) {
            log.info("Auto-refund by system skipped: booking {} no longer in ESCROW_HELD or ACCEPTED", bookingId);
            return;
        }

        // 2. Conditional update on Escrow: WHERE status = HELD
        Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(bookingId))
                .and("status").is(EscrowStatus.HELD));
        Update escrowUpdate = new Update()
                .set("status", EscrowStatus.REFUNDED)
                .set("releasedAt", now());
        EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

        if (updatedEscrow == null) {
            log.warn("Auto-refund by system: Escrow for booking {} was not in HELD state. Mentee wallet balance untouched.", bookingId);
            return;
        }

        // 3. Credit wallet
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(updatedEscrow.getMenteeId())),
                new Update().inc("walletBalance", updatedEscrow.getTotalAmount()),
                User.class
        );
        recordWalletTxn(updatedEscrow.getMenteeId().toHexString(), TransactionType.REFUND, updatedEscrow.getTotalAmount(),
                reason != null ? reason : ("System auto-refund for booking #" + bookingId), bookingId);
        log.info("System auto-refunded booking {}: {}", bookingId, reason);
    }

    // ── internals ────────────────────────────────────────────────────────────

    private BookingResponse releaseEscrow(Booking booking) {
        // 1. Conditional update on Booking: TAUGHT -> COMPLETED
        Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                .and("status").is(BookingStatus.TAUGHT));
        Update bookingUpdate = new Update().set("status", BookingStatus.COMPLETED);
        Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updatedBooking == null) {
            throw new BadRequestException("Buổi học không ở trạng thái đã dạy (TAUGHT) hoặc đã được xác nhận/khiếu nại.");
        }

        // 2. Conditional update on Escrow: HELD -> RELEASED
        Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(booking.getId()))
                .and("status").is(EscrowStatus.HELD));
        Update escrowUpdate = new Update()
                .set("status", EscrowStatus.RELEASED)
                .set("releasedAt", now());
        EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

        if (updatedEscrow == null) {
            log.warn("Escrow for booking {} was not in HELD state. Release aborted, wallet balance untouched.", booking.getId());
            throw new BadRequestException("Giao dịch ký quỹ không ở trạng thái tạm giữ (HELD) hoặc đã được xử lý.");
        }

        // 3. ONLY IF escrow transition succeeded: credit mentor wallet
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(updatedEscrow.getMentorId())),
                new Update().inc("walletBalance", updatedEscrow.getMentorPayout()),
                User.class
        );

        recordWalletTxn(updatedEscrow.getMentorId().toHexString(), TransactionType.PAYOUT, updatedEscrow.getMentorPayout(),
                "Payout for booking " + booking.getId(), booking.getId());

        return bookingMapper.toResponse(updatedBooking);
    }

    private BookingResponse refundEscrow(Booking booking) {
        // 1. Conditional update on Booking: WHERE status in [ESCROW_HELD, ACCEPTED]
        Query bookingQuery = new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))
                .and("status").in(BookingStatus.ESCROW_HELD, BookingStatus.ACCEPTED));
        Update bookingUpdate = new Update().set("status", BookingStatus.REFUNDED);
        Booking updatedBooking = mongoTemplate.findAndModify(bookingQuery, bookingUpdate,
                FindAndModifyOptions.options().returnNew(true), Booking.class);

        if (updatedBooking == null) {
            throw new BadRequestException("Buổi học không ở trạng thái hợp lệ để từ chối hoặc hoàn tiền.");
        }

        // 2. Conditional update on Escrow: HELD -> REFUNDED
        Query escrowQuery = new Query(Criteria.where("bookingId").is(new ObjectId(booking.getId()))
                .and("status").is(EscrowStatus.HELD));
        Update escrowUpdate = new Update()
                .set("status", EscrowStatus.REFUNDED)
                .set("releasedAt", now());
        EscrowTransaction updatedEscrow = mongoTemplate.findAndModify(escrowQuery, escrowUpdate,
                FindAndModifyOptions.options().returnNew(true), EscrowTransaction.class);

        if (updatedEscrow == null) {
            log.warn("Escrow for booking {} was not in HELD state. Refund aborted, wallet balance untouched.", booking.getId());
            throw new BadRequestException("Giao dịch ký quỹ không ở trạng thái tạm giữ (HELD) hoặc đã được xử lý.");
        }

        // 3. ONLY IF escrow transition succeeded: credit mentee wallet
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(updatedEscrow.getMenteeId())),
                new Update().inc("walletBalance", updatedEscrow.getTotalAmount()),
                User.class
        );

        recordWalletTxn(updatedEscrow.getMenteeId().toHexString(), TransactionType.REFUND, updatedEscrow.getTotalAmount(),
                "Refund for booking " + booking.getId(), booking.getId());

        return bookingMapper.toResponse(updatedBooking);
    }

    private void recordWalletTxn(String userId, TransactionType type, long amount,
                                 String description, String bookingId) {
        walletTxnRepository.save(WalletTransaction.builder()
                .userId(new ObjectId(userId))
                .type(type)
                .status(TransactionStatus.COMPLETED)
                .amount(amount)
                .description(description)
                .relatedBookingId(bookingId)
                .createdAt(now())
                .updatedAt(now())
                .build());
    }

    private Booking requireBooking(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    private EscrowTransaction requireEscrow(String bookingId) {
        return escrowRepository.findByBookingId(new ObjectId(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Escrow not found for booking: " + bookingId));
    }

    private void requireStatus(Booking booking, BookingStatus expected) {
        if (booking.getStatus() != expected) {
            throw new BadRequestException(
                    "Expected booking status " + expected + " but was " + booking.getStatus());
        }
    }

    private void sendPaymentSuccessEmail(User mentee, Booking booking) {
        try {
            // Find mentor user
            User mentor = userRepository.findById(booking.getMentorId().toHexString()).orElse(null);
            String mentorName = (mentor != null && mentor.getFullName() != null) ? mentor.getFullName() : "Mentor";
            String mentorEmail = (mentor != null && mentor.getEmail() != null) ? mentor.getEmail() : null;

            // Find course name from mentor's profile if available
            String courseCode = booking.getCourseCode() != null ? booking.getCourseCode() : "N/A";
            String courseName = courseCode;
            MentorProfile mentorProfile = mentorRepository.findByUserId(booking.getMentorId()).orElse(null);
            if (mentorProfile != null && mentorProfile.getCourses() != null) {
                for (Course c : mentorProfile.getCourses()) {
                    if (c.getCode() != null && c.getCode().equalsIgnoreCase(courseCode)) {
                        courseName = (c.getName() != null && !c.getName().isBlank())
                                ? c.getCode() + " - " + c.getName()
                                : c.getCode();
                        break;
                    }
                }
            }

            // Format representation
            String formatStr = booking.getFormat() == BookingFormat.ONE_ON_ONE
                    ? "Học 1-kèm-1 (Cá nhân)"
                    : (booking.getFormat() == BookingFormat.GROUP ? "Học nhóm" : "Trực tuyến");

            // 1. Gửi email xác nhận đặt lịch & thời gian chi tiết cho Mentee (Async)
            mailService.sendBookingPaymentSuccessEmail(
                    mentee.getEmail(),
                    mentee.getFullName(),
                    booking.getId(),
                    booking.getEffectiveRoomId(),
                    courseCode,
                    courseName,
                    mentorName,
                    formatStr,
                    booking.getStartAt(),
                    booking.getDurationMin(),
                    booking.getPrice()
            );

            // 2. Gửi email thông báo lịch dạy mới cho Mentor (Chạy song song qua @Async TaskExecutor)
            if (mentorEmail != null && !mentorEmail.isBlank()) {
                mailService.sendMentorNewBookingEmail(
                        mentorEmail,
                        mentorName,
                        mentee.getFullName(),
                        mentee.getEmail(),
                        booking.getId(),
                        booking.getEffectiveRoomId(),
                        courseCode,
                        courseName,
                        formatStr,
                        booking.getStartAt(),
                        booking.getDurationMin(),
                        booking.getPrice()
                );
            }
        } catch (Exception e) {
            log.error("Failed to trigger booking payment success emails for booking {}: {}", booking.getId(), e.getMessage());
        }
    }
}
