package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingRequest;
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
import com.dynforge.be.repository.WalletTransactionRepository;
import com.dynforge.be.scheduler.ReconciliationAuditScheduler;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase2ConcurrencySafetyTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private EscrowTransactionRepository escrowRepository;
    @Mock
    private WalletTransactionRepository walletTxnRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private MailService mailService;
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private DistributedLockService distributedLockService;

    @InjectMocks
    private EscrowService escrowService;

    private BookingService bookingService;
    private ReconciliationAuditScheduler auditScheduler;

    private ObjectId menteeId;
    private ObjectId mentorId;
    private ObjectId bookingId;
    private User mentee;
    private User mentor;

    @BeforeEach
    void setUp() {
        menteeId = new ObjectId();
        mentorId = new ObjectId();
        bookingId = new ObjectId();

        mentee = User.builder()
                .id(menteeId.toHexString())
                .fullName("Mentee Concurrency")
                .email("mentee@dynforge.com")
                .roles(Set.of(Role.MENTEE))
                .walletBalance(1_000_000L)
                .build();

        mentor = User.builder()
                .id(mentorId.toHexString())
                .fullName("Mentor Concurrency")
                .email("mentor@dynforge.com")
                .roles(Set.of(Role.MENTOR))
                .walletBalance(0L)
                .build();

        lenient().when(distributedLockService.executeWithLock(anyString(), any(), any(), any(Supplier.class)))
                .thenAnswer(inv -> {
                    Supplier<?> action = inv.getArgument(3);
                    return action.get();
                });

        bookingService = new BookingService(
                bookingRepository,
                mentorRepository,
                escrowRepository,
                bookingMapper,
                escrowService,
                userRepository,
                mailService,
                mongoTemplate,
                distributedLockService
        );

        auditScheduler = new ReconciliationAuditScheduler(
                escrowRepository,
                bookingRepository,
                mongoTemplate
        );
    }

    // ── REQUIREMENT 1: CONDITIONAL STATE TRANSITION VIA findAndModify ─────────

    @Test
    @DisplayName("Concurrent confirm: if Escrow is not in HELD, abort release without crediting wallet")
    void concurrentRelease_EscrowNotHeld_AbortsWithoutWalletCredit() {
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .status(BookingStatus.TAUGHT)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        // 1. Booking findAndModify matches TAUGHT -> returns updated booking
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenReturn(booking);

        // 2. Escrow findAndModify returns null (was already released or refunded concurrently by another thread)
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(EscrowTransaction.class))).thenReturn(null);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                escrowService.confirmAndRelease(mentee, booking.getId())
        );

        assertTrue(ex.getMessage().contains("không ở trạng thái tạm giữ (HELD)") || ex.getMessage().contains("đã được xử lý"));

        // CRITICAL CHECK: Verify wallet balance update was NEVER called
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(walletTxnRepository, never()).save(any());
    }

    @Test
    @DisplayName("Concurrent refund: if Escrow is not in HELD, abort refund without touching wallet")
    void concurrentRefund_EscrowNotHeld_AbortsWithoutWalletCredit() {
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .status(BookingStatus.ACCEPTED)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenReturn(booking);
        // Escrow findAndModify returns null
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(EscrowTransaction.class))).thenReturn(null);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                escrowService.decline(mentor, booking.getId())
        );

        assertTrue(ex.getMessage().contains("không ở trạng thái tạm giữ (HELD)") || ex.getMessage().contains("đã được xử lý"));

        // CRITICAL CHECK: Verify wallet was NOT modified
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(walletTxnRepository, never()).save(any());
    }

    @Test
    @DisplayName("Auto-confirm scheduler: if Escrow is not HELD, skips gracefully without wallet update")
    void autoConfirm_EscrowNotHeld_SkipsGracefully() {
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .status(BookingStatus.TAUGHT)
                .build();

        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenReturn(booking);
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(EscrowTransaction.class))).thenReturn(null);

        assertDoesNotThrow(() -> escrowService.autoConfirm(booking.getId()));

        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(walletTxnRepository, never()).save(any());
    }

    @Test
    @DisplayName("Auto-refund scheduler: if Booking not in [ESCROW_HELD, ACCEPTED], skips gracefully")
    void autoRefund_BookingNotInExpectedState_SkipsGracefully() {
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenReturn(null);

        assertDoesNotThrow(() -> escrowService.autoRefundBySystem(bookingId.toHexString(), "Timeout"));

        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(User.class));
        verify(walletTxnRepository, never()).save(any());
    }

    // ── REQUIREMENT 2: SCHEDULE CONFLICT WITH PENDING_PAYMENT ────────────────

    @Test
    @DisplayName("Schedule conflict check includes active PENDING_PAYMENT booking")
    void createBooking_ActivePendingPaymentConflict_ThrowsBadRequest() {
        Instant reqStart = Instant.now().plus(Duration.ofDays(1));

        MentorProfile mentorProfile = MentorProfile.builder()
                .userId(mentorId)
                .verified(true)
                .courses(List.of(Course.builder()
                        .code("CS101")
                        .ratePrivate(200_000L)
                        .build()))
                .build();

        when(mentorRepository.findByUserId(mentorId)).thenReturn(Optional.of(mentorProfile));

        // Active PENDING_PAYMENT created 5 minutes ago overlapping with requested time
        Booking existingPendingBooking = Booking.builder()
                .id(new ObjectId().toHexString())
                .mentorId(mentorId)
                .menteeId(new ObjectId())
                .status(BookingStatus.PENDING_PAYMENT)
                .startAt(reqStart.minus(15, ChronoUnit.MINUTES))
                .durationMin(60)
                .createdAt(Instant.now().minus(5, ChronoUnit.MINUTES))
                .build();

        when(bookingRepository.findByMentorIdAndStatusIn(eq(mentorId), any()))
                .thenReturn(List.of(existingPendingBooking));

        BookingRequest request = new BookingRequest(
                mentorId.toHexString(),
                "CS101",
                BookingFormat.ONE_ON_ONE,
                reqStart,
                60
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.create(mentee, request)
        );

        assertTrue(ex.getMessage().contains("Mentor đã có lịch dạy khác trong khung giờ này"));
    }

    @Test
    @DisplayName("Schedule conflict check ignores expired PENDING_PAYMENT (> 30 min)")
    void createBooking_ExpiredPendingPayment_IgnoresAndAllowsBooking() {
        Instant reqStart = Instant.now().plus(Duration.ofDays(1));

        Course course = Course.builder()
                .code("CS101")
                .ratePrivate(200_000L)
                .build();

        MentorProfile mentorProfile = MentorProfile.builder()
                .userId(mentorId)
                .verified(true)
                .courses(List.of(course))
                .build();

        when(mentorRepository.findByUserId(mentorId)).thenReturn(Optional.of(mentorProfile));

        // Expired PENDING_PAYMENT created 35 minutes ago
        Booking expiredPending = Booking.builder()
                .id(new ObjectId().toHexString())
                .mentorId(mentorId)
                .menteeId(new ObjectId())
                .status(BookingStatus.PENDING_PAYMENT)
                .startAt(reqStart.minus(15, ChronoUnit.MINUTES))
                .durationMin(60)
                .createdAt(Instant.now().minus(35, ChronoUnit.MINUTES))
                .build();

        when(bookingRepository.findByMentorIdAndStatusIn(eq(mentorId), any()))
                .thenReturn(List.of(expiredPending));
        when(bookingRepository.findByMenteeIdAndStatusIn(eq(menteeId), any()))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        BookingRequest request = new BookingRequest(
                mentorId.toHexString(),
                "CS101",
                BookingFormat.ONE_ON_ONE,
                reqStart,
                60
        );

        assertDoesNotThrow(() -> bookingService.create(mentee, request));
    }

    // ── REQUIREMENT 3: RECONCILIATION AUDIT JOB ──────────────────────────────

    @Test
    @DisplayName("Reconciliation audit detects mismatches and negative balances without altering money")
    void reconciliationAudit_DetectsAnomaliesWithoutModifyingMoney() {
        // 1. Escrow HELD but booking is COMPLETED
        Booking completedBooking = Booking.builder()
                .id(bookingId.toHexString())
                .status(BookingStatus.COMPLETED)
                .build();

        EscrowTransaction mismatchedEscrow = EscrowTransaction.builder()
                .id(new ObjectId().toHexString())
                .bookingId(bookingId)
                .menteeId(menteeId)
                .mentorId(mentorId)
                .totalAmount(500_000L)
                .status(EscrowStatus.HELD)
                .build();

        when(escrowRepository.findAll()).thenReturn(List.of(mismatchedEscrow));
        when(bookingRepository.findById(bookingId.toHexString())).thenReturn(Optional.of(completedBooking));
        when(bookingRepository.findAll()).thenReturn(List.of(completedBooking));

        // 2. Negative wallet balance user
        User negativeUser = User.builder()
                .id(new ObjectId().toHexString())
                .email("debtor@example.com")
                .walletBalance(-50_000L)
                .build();

        when(mongoTemplate.find(any(Query.class), eq(User.class))).thenReturn(List.of(negativeUser));

        // Run audit
        assertDoesNotThrow(() -> auditScheduler.runAudit());

        // CRITICAL REQUIREMENT: "chỉ ghi log cảnh báo, không tự sửa tiền"
        // Verify NO save, insert, update, or delete operations were executed on wallets or escrows
        verify(escrowRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
        verify(mongoTemplate, never()).updateFirst(any(), any(), any(Class.class));
        verify(walletTxnRepository, never()).save(any());
    }
}
