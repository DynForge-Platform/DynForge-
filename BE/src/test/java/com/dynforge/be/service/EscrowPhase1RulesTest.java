package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingResponse;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.entity.WalletTransaction;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.model.enums.TransactionType;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.EscrowTransactionRepository;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.repository.WalletTransactionRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EscrowPhase1RulesTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EscrowTransactionRepository escrowRepository;
    @Mock
    private WalletTransactionRepository walletTxnRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private MailService mailService;
    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private EscrowService escrowService;

    private User mentee;
    private ObjectId menteeId;
    private ObjectId mentorId;
    private ObjectId bookingId;

    @BeforeEach
    void setUp() {
        menteeId = new ObjectId();
        mentorId = new ObjectId();
        bookingId = new ObjectId();

        mentee = User.builder()
                .id(menteeId.toHexString())
                .fullName("Nguyen Van Mentee")
                .email("mentee@example.com")
                .roles(Set.of(Role.MENTEE))
                .build();
    }

    @Test
    @DisplayName("Dispute opening before startAt + 15 minutes should be rejected")
    void disputeBefore15MinutesShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofHours(2)); // startAt is in future
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .status(BookingStatus.ACCEPTED)
                .startAt(startAt)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                escrowService.dispute(mentee, booking.getId(), "TUTOR_NO_SHOW", "Mentor không đến")
        );
        assertTrue(ex.getMessage().contains("15 phút"));
    }

    @Test
    @DisplayName("Dispute opening after startAt + 15 minutes should succeed")
    void disputeAfter15MinutesShouldSucceed() {
        Instant startAt = Instant.now().minus(Duration.ofMinutes(20)); // started 20 minutes ago
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .status(BookingStatus.ACCEPTED)
                .startAt(startAt)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenAnswer(inv -> {
            booking.setStatus(BookingStatus.DISPUTED);
            booking.setDisputeIssueType("TUTOR_NO_SHOW");
            booking.setDisputeReason("Mentor không xuất hiện trong phòng học");
            return booking;
        });

        escrowService.dispute(mentee, booking.getId(), "TUTOR_NO_SHOW", "Mentor không xuất hiện trong phòng học");

        assertEquals(BookingStatus.DISPUTED, booking.getStatus());
        assertEquals("TUTOR_NO_SHOW", booking.getDisputeIssueType());
        assertEquals("Mentor không xuất hiện trong phòng học", booking.getDisputeReason());
    }

    @Test
    @DisplayName("Refund with penalty applies 15% platform commission on the 30% mentor compensation")
    void refundWithPenaltyAppliesCommission() {
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .price(1000000L)
                .commissionRate(0.15)
                .status(BookingStatus.ACCEPTED)
                .build();

        EscrowTransaction escrow = EscrowTransaction.builder()
                .id(new ObjectId().toHexString())
                .bookingId(bookingId)
                .menteeId(menteeId)
                .mentorId(mentorId)
                .totalAmount(1000000L)
                .commissionRate(0.15)
                .commissionAmount(150000L)
                .mentorPayout(850000L)
                .status(EscrowStatus.HELD)
                .build();

        when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class))).thenReturn(booking);
        when(mongoTemplate.findAndModify(any(), any(), any(), eq(EscrowTransaction.class))).thenReturn(escrow);

        // 70% refund to mentee, 30% penalty gross (300,000)
        escrowService.refundEscrowWithPenalty(booking, 0.70, "Hủy lịch 12h-24h");

        // Mentee refund: 700,000
        // Penalty gross: 300,000
        // 15% commission on 300,000 = 45,000
        // Mentor net payout = 300,000 - 45,000 = 255,000
        ArgumentCaptor<WalletTransaction> txnCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTxnRepository, atLeast(2)).save(txnCaptor.capture());

        List<WalletTransaction> capturedTxns = txnCaptor.getAllValues();
        WalletTransaction menteeRefundTxn = capturedTxns.stream()
                .filter(t -> t.getType() == TransactionType.REFUND)
                .findFirst().orElseThrow();
        assertEquals(700000L, menteeRefundTxn.getAmount());

        WalletTransaction mentorPayoutTxn = capturedTxns.stream()
                .filter(t -> t.getType() == TransactionType.PAYOUT)
                .findFirst().orElseThrow();
        assertEquals(255000L, mentorPayoutTxn.getAmount());

        WalletTransaction commissionTxn = capturedTxns.stream()
                .filter(t -> t.getType() == TransactionType.COMMISSION)
                .findFirst().orElseThrow();
        assertEquals(45000L, commissionTxn.getAmount());
    }
}
