package com.dynforge.be.testutil;

import com.dynforge.be.model.entity.*;
import com.dynforge.be.model.enums.*;
import com.dynforge.be.repository.*;
import com.dynforge.be.scheduler.BookingAutoConfirmScheduler;
import com.dynforge.be.service.BookingService;
import com.dynforge.be.service.EscrowService;
import com.dynforge.be.service.MailService;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseMongoIntegrationTest {

    @Autowired
    protected MongoTemplate mongoTemplate;

    @Autowired
    protected BookingRepository bookingRepository;

    @Autowired
    protected EscrowTransactionRepository escrowRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected MentorRepository mentorRepository;

    @Autowired
    protected WalletTransactionRepository walletTxnRepository;

    @Autowired
    protected RecordingRepository recordingRepository;

    @Autowired
    protected BookingService bookingService;

    @Autowired
    protected EscrowService escrowService;

    @Autowired
    protected BookingAutoConfirmScheduler scheduler;

    @MockitoBean
    protected MailService mailService;

    protected MutableClock mutableClock;

    @BeforeAll
    void verifyMongoDatabaseSafety() {
        String dbName = mongoTemplate.getDb().getName();
        if (!dbName.endsWith("_test")) {
            throw new IllegalStateException("CRITICAL SAFETY VIOLATION: Refusing to run tests on non-test database: " + dbName);
        }
        try {
            mongoTemplate.executeCommand("{ ping: 1 }");
        } catch (Exception e) {
            throw new IllegalStateException("Hãy khởi động service MongoDB! Cannot connect to test database.", e);
        }
    }

    @BeforeEach
    void cleanTestDatabase() {
        String dbName = mongoTemplate.getDb().getName();
        if (!dbName.endsWith("_test")) {
            throw new IllegalStateException("CRITICAL SAFETY VIOLATION: Database name is not _test: " + dbName);
        }
        for (String collectionName : mongoTemplate.getCollectionNames()) {
            if (!collectionName.startsWith("system.")) {
                mongoTemplate.getCollection(collectionName).deleteMany(new Document());
            }
        }
        mutableClock = new MutableClock(Instant.parse("2026-10-04T12:00:00Z"));
        bookingService.setClock(mutableClock);
        escrowService.setClock(mutableClock);
        scheduler.setClock(mutableClock);
    }

    public static class SystemMoneyState {
        public final long menteeWallet;
        public final long mentorWallet;
        public final long commission;
        public final long heldEscrow;
        public final long total;

        public SystemMoneyState(long menteeWallet, long mentorWallet, long commission, long heldEscrow) {
            this.menteeWallet = menteeWallet;
            this.mentorWallet = mentorWallet;
            this.commission = commission;
            this.heldEscrow = heldEscrow;
            this.total = menteeWallet + mentorWallet + commission + heldEscrow;
        }
    }

    protected SystemMoneyState getMoneyState(String menteeId, String mentorId) {
        long menteeBal = userRepository.findById(menteeId).map(User::getWalletBalance).orElse(0L);
        long mentorBal = userRepository.findById(mentorId).map(User::getWalletBalance).orElse(0L);

        long heldEscrow = escrowRepository.findAll().stream()
                .filter(e -> e.getStatus() == EscrowStatus.HELD)
                .mapToLong(EscrowTransaction::getTotalAmount)
                .sum();

        long releasedCommission = escrowRepository.findAll().stream()
                .filter(e -> e.getStatus() == EscrowStatus.RELEASED)
                .mapToLong(EscrowTransaction::getCommissionAmount)
                .sum();

        long penaltyCommission = walletTxnRepository.findAll().stream()
                .filter(t -> t.getType() == TransactionType.COMMISSION)
                .mapToLong(WalletTransaction::getAmount)
                .sum();

        long totalCommission = releasedCommission + penaltyCommission;

        return new SystemMoneyState(menteeBal, mentorBal, totalCommission, heldEscrow);
    }

    /**
     * Shared Money Conservation Assertion:
     * menteeWallet + mentorWallet + commission + heldEscrow remains constant before and after the action.
     */
    protected void assertMoneyConserved(String menteeId, String mentorId, Runnable action) {
        SystemMoneyState before = getMoneyState(menteeId, mentorId);
        try {
            action.run();
        } finally {
            SystemMoneyState after = getMoneyState(menteeId, mentorId);
            assertEquals(before.total, after.total,
                    String.format("Money conservation violated! Before total=%d (Mentee=%d, Mentor=%d, Comm=%d, HeldEscrow=%d) " +
                                    "vs After total=%d (Mentee=%d, Mentor=%d, Comm=%d, HeldEscrow=%d)",
                            before.total, before.menteeWallet, before.mentorWallet, before.commission, before.heldEscrow,
                            after.total, after.menteeWallet, after.mentorWallet, after.commission, after.heldEscrow));
        }
    }

    // ── Factory Helpers ───────────────────────────────────────────────────────

    protected User createMentee(String name, String email, long balance) {
        User user = User.builder()
                .fullName(name)
                .email(email)
                .phone("0987654321")
                .roles(Set.of(Role.MENTEE))
                .status(UserStatus.ACTIVE)
                .walletBalance(balance)
                .build();
        return userRepository.save(user);
    }

    protected User createMentor(String name, String email, long balance, long hourlyRate) {
        User user = User.builder()
                .fullName(name)
                .email(email)
                .phone("0912345678")
                .roles(Set.of(Role.MENTOR))
                .status(UserStatus.ACTIVE)
                .walletBalance(balance)
                .build();
        User savedUser = userRepository.save(user);

        Course course = Course.builder()
                .code("PRN211")
                .name("Basic Cross-Platform Application Programming")
                .grade("A")
                .ratePrivate(hourlyRate)
                .rateGroup(hourlyRate / 2)
                .build();

        MentorProfile profile = MentorProfile.builder()
                .userId(new ObjectId(savedUser.getId()))
                .title("Expert Software Engineer")
                .verified(true)
                .courses(List.of(course))
                .mentorCancelCount(0)
                .mentorNoShowCount(0)
                .build();
        mentorRepository.save(profile);

        return savedUser;
    }

    protected Booking createBooking(User mentee, User mentor, Instant startAt, int durationMin,
                                   BookingStatus status, long price, double commissionRate) {
        Booking booking = Booking.builder()
                .menteeId(new ObjectId(mentee.getId()))
                .mentorId(new ObjectId(mentor.getId()))
                .startAt(startAt)
                .durationMin(durationMin)
                .price(price)
                .commissionRate(commissionRate)
                .format(BookingFormat.ONE_ON_ONE)
                .status(status)
                .rescheduleCount(0)
                .courseCode("PRN211")
                .createdAt(startAt.minus(2, java.time.temporal.ChronoUnit.DAYS))
                .build();
        return bookingRepository.save(booking);
    }

    protected EscrowTransaction createEscrow(Booking booking, EscrowStatus status) {
        long total = booking.getPrice();
        double rate = booking.getCommissionRate();
        long commission = Math.round(total * rate);
        long payout = total - commission;

        EscrowTransaction escrow = EscrowTransaction.builder()
                .bookingId(new ObjectId(booking.getId()))
                .menteeId(booking.getMenteeId())
                .mentorId(booking.getMentorId())
                .totalAmount(total)
                .commissionRate(rate)
                .commissionAmount(commission)
                .mentorPayout(payout)
                .status(status)
                .heldAt(booking.getCreatedAt())
                .build();
        EscrowTransaction saved = escrowRepository.save(escrow);

        booking.setEscrowTxnId(new ObjectId(saved.getId()));
        bookingRepository.save(booking);
        return saved;
    }
}
