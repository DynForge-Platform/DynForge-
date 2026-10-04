package com.dynforge.be.service;

import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingResponse;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.Recording;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.EscrowTransactionRepository;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.RecordingRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.scheduler.BookingAutoConfirmScheduler;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase3AutoRefundNoShowTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EscrowService escrowService;
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private RecordingRepository recordingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MailService mailService;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private EscrowTransactionRepository escrowRepository;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private DistributedLockService distributedLockService;

    private BookingAutoConfirmScheduler scheduler;
    private BookingService bookingService;

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
                .fullName("Mentee Tester")
                .email("mentee@test.com")
                .roles(Set.of(Role.MENTEE))
                .build();

        mentor = User.builder()
                .id(mentorId.toHexString())
                .fullName("Mentor Tester")
                .email("mentor@test.com")
                .roles(Set.of(Role.MENTOR))
                .build();

        scheduler = new BookingAutoConfirmScheduler(
                bookingRepository,
                escrowService,
                mongoTemplate,
                recordingRepository,
                userRepository,
                mailService
        );

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
    }

    @Test
    @DisplayName("No-show with Recording: DO NOT auto-refund, transition to DISPUTED for Admin review")
    void autoRefundNoShow_WithRecording_ShiftsToDisputedInsteadOfRefund() {
        Instant startAt = Instant.now().minus(Duration.ofHours(26)); // ended ~25 hours ago
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .mentorId(mentorId)
                .menteeId(menteeId)
                .status(BookingStatus.ACCEPTED)
                .startAt(startAt)
                .durationMin(60)
                .build();

        when(bookingRepository.findByStatus(BookingStatus.ACCEPTED)).thenReturn(List.of(booking));

        // Recording exists!
        Recording rec = Recording.builder()
                .id(new ObjectId().toHexString())
                .bookingId(bookingId)
                .uploaderId(mentorId)
                .build();
        when(recordingRepository.findByBookingIdOrderByCreatedAtDesc(eq(bookingId))).thenReturn(List.of(rec));

        scheduler.autoRefundNoShowBookings();

        // 1. Escrow must NOT be refunded automatically!
        verify(escrowService, never()).autoRefundBySystem(anyString(), anyString());

        // 2. Booking must be updated to DISPUTED with RECORDING_REVIEW
        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).findAndModify(any(Query.class), updateCaptor.capture(), any(), eq(Booking.class));

        Update capturedUpdate = updateCaptor.getValue();
        assertEquals(BookingStatus.DISPUTED, capturedUpdate.getUpdateObject().get("$set", org.bson.Document.class).get("status"));
        assertEquals("RECORDING_REVIEW", capturedUpdate.getUpdateObject().get("$set", org.bson.Document.class).get("disputeIssueType"));

        // 3. mentorNoShowCount must NOT be incremented
        verify(mongoTemplate, never()).updateFirst(any(Query.class), any(Update.class), eq(MentorProfile.class));
    }

    @Test
    @DisplayName("No-show without Recording: auto-refunds mentee and increments mentorNoShowCount")
    void autoRefundNoShow_WithoutRecording_AutoRefundsAndIncrementsNoShowCount() {
        Instant startAt = Instant.now().minus(Duration.ofHours(26)); // ended ~25 hours ago
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .mentorId(mentorId)
                .menteeId(menteeId)
                .status(BookingStatus.ACCEPTED)
                .startAt(startAt)
                .durationMin(60)
                .build();

        when(bookingRepository.findByStatus(BookingStatus.ACCEPTED)).thenReturn(List.of(booking));
        when(recordingRepository.findByBookingIdOrderByCreatedAtDesc(eq(bookingId))).thenReturn(Collections.emptyList());

        scheduler.autoRefundNoShowBookings();

        // 1. Must call auto-refund
        verify(escrowService).autoRefundBySystem(eq(booking.getId()), contains("No-show"));

        // 2. Must increment mentorNoShowCount
        ArgumentCaptor<Update> profileUpdateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), profileUpdateCaptor.capture(), eq(MentorProfile.class));

        Update profileUpdate = profileUpdateCaptor.getValue();
        assertEquals(1, profileUpdate.getUpdateObject().get("$inc", org.bson.Document.class).get("mentorNoShowCount"));
    }

    @Test
    @DisplayName("Mentor cancels booking: increments mentorCancelCount in MentorProfile")
    void mentorCancel_IncrementsMentorCancelCount() {
        Booking booking = Booking.builder()
                .id(bookingId.toHexString())
                .mentorId(mentorId)
                .menteeId(menteeId)
                .status(BookingStatus.ACCEPTED)
                .startAt(Instant.now().plus(Duration.ofHours(24)))
                .durationMin(60)
                .price(300_000L)
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(escrowService.refundEscrowWithPenalty(any(), eq(1.0), anyString()))
                .thenReturn(new BookingResponse(
                        booking.getId(), menteeId.toHexString(), mentorId.toHexString(),
                        "Mentee", "Mentor", "PRN211", BookingFormat.ONE_ON_ONE,
                        booking.getStartAt(), 60, 300_000L, 0.15,
                        BookingStatus.CANCELLED, null, null, null, null, null, null, null, null, null, null, null, 0,
                        "DynForge-" + booking.getId()
                ));

        bookingService.cancel(mentor, booking.getId());

        // Verify mentorCancelCount was incremented
        ArgumentCaptor<Update> updateCaptor = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), updateCaptor.capture(), eq(MentorProfile.class));

        Update update = updateCaptor.getValue();
        assertEquals(1, update.getUpdateObject().get("$inc", org.bson.Document.class).get("mentorCancelCount"));
    }

    @Test
    @DisplayName("Post-session reminders: sends 2h reminder and 12h warning before auto-refund")
    void sendPostSessionReminders_2hAnd12h() {
        // Booking 1: ended 3 hours ago -> should get 2h reminder
        Booking b1 = Booking.builder()
                .id(new ObjectId().toHexString())
                .mentorId(mentorId)
                .menteeId(menteeId)
                .courseCode("PRN211")
                .status(BookingStatus.ACCEPTED)
                .startAt(Instant.now().minus(Duration.ofHours(4)))
                .durationMin(60)
                .reminder2hSent(false)
                .reminder12hSent(false)
                .build();

        // Booking 2: ended 14 hours ago -> should get 12h warning
        Booking b2 = Booking.builder()
                .id(new ObjectId().toHexString())
                .mentorId(mentorId)
                .menteeId(menteeId)
                .courseCode("PRN211")
                .status(BookingStatus.ACCEPTED)
                .startAt(Instant.now().minus(Duration.ofHours(15)))
                .durationMin(60)
                .reminder2hSent(true)
                .reminder12hSent(false)
                .build();

        when(bookingRepository.findByStatus(BookingStatus.ACCEPTED)).thenReturn(List.of(b1, b2));
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));

        when(mongoTemplate.findAndModify(any(Query.class), any(Update.class), any(), eq(Booking.class)))
                .thenReturn(b1, b2);

        scheduler.sendPostSessionMarkTaughtReminders();

        // Verify emails sent
        verify(mailService).sendMentorMarkTaughtReminder(eq(mentor.getEmail()), eq(mentor.getFullName()), eq(b1.getId()), eq("PRN211"), eq(2));
        verify(mailService).sendMentorMarkTaughtReminder(eq(mentor.getEmail()), eq(mentor.getFullName()), eq(b2.getId()), eq("PRN211"), eq(12));
    }
}
