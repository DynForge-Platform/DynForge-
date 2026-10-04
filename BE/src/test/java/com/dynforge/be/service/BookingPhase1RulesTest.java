package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.mapper.BookingMapper;
import com.dynforge.be.model.dto.BookingResponse;
import com.dynforge.be.model.dto.RescheduleRequest;
import com.dynforge.be.model.dto.RescheduleRespondRequest;
import com.dynforge.be.model.entity.Booking;
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
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingPhase1RulesTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private MentorRepository mentorRepository;
    @Mock
    private EscrowTransactionRepository escrowRepository;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private EscrowService escrowService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MailService mailService;
    @Mock
    private MongoTemplate mongoTemplate;
    @Mock
    private DistributedLockService distributedLockService;

    @InjectMocks
    private BookingService bookingService;

    private User mentee;
    private User mentor;
    private ObjectId menteeId;
    private ObjectId mentorId;

    @BeforeEach
    void setUp() {
        menteeId = new ObjectId();
        mentorId = new ObjectId();

        lenient().when(distributedLockService.executeWithLock(anyString(), any(), any(), any(java.util.function.Supplier.class)))
                .thenAnswer(inv -> {
                    java.util.function.Supplier<?> action = inv.getArgument(3);
                    return action.get();
                });

        lenient().when(mongoTemplate.findAndModify(any(), any(), any(), eq(Booking.class)))
                .thenAnswer(inv -> new Booking());

        mentee = User.builder()
                .id(menteeId.toHexString())
                .fullName("Nguyen Van Mentee")
                .email("mentee@example.com")
                .roles(Set.of(Role.MENTEE))
                .build();

        mentor = User.builder()
                .id(mentorId.toHexString())
                .fullName("Tran Van Mentor")
                .email("mentor@example.com")
                .roles(Set.of(Role.MENTOR))
                .build();
    }

    private Booking createBooking(Instant startAt, BookingStatus status, int rescheduleCount) {
        return Booking.builder()
                .id(new ObjectId().toHexString())
                .menteeId(menteeId)
                .mentorId(mentorId)
                .courseCode("PRN211")
                .format(BookingFormat.ONE_ON_ONE)
                .startAt(startAt)
                .durationMin(60)
                .price(200000L)
                .commissionRate(0.15)
                .status(status)
                .rescheduleCount(rescheduleCount)
                .build();
    }

    @Test
    @DisplayName("Mentee cannot cancel within 12 hours before startAt")
    void menteeCancelUnder12HoursShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofHours(5));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.cancel(mentee, booking.getId())
        );
        assertTrue(ex.getMessage().contains("12 giờ"));
    }

    private BookingResponse dummyResponse() {
        return new BookingResponse(
                "booking-123", menteeId.toHexString(), mentorId.toHexString(),
                "Mentee", "Mentor", "PRN211", BookingFormat.ONE_ON_ONE,
                Instant.now(), 60, 200000L, 0.15, BookingStatus.ACCEPTED,
                null, Instant.now(), null, null, null, null, null, null, null, null, null, 0,
                "DynForge-booking-123"
        );
    }

    @Test
    @DisplayName("Mentee cancel 12-24h before startAt should trigger 70% refund")
    void menteeCancelBetween12And24Hours() {
        Instant startAt = Instant.now().plus(Duration.ofHours(18));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));
        when(escrowService.refundEscrowWithPenalty(eq(booking), eq(0.70), anyString()))
                .thenReturn(dummyResponse());

        bookingService.cancel(mentee, booking.getId());

        verify(escrowService).refundEscrowWithPenalty(eq(booking), eq(0.70), anyString());
        verify(mailService).sendCancellationNotification(eq(mentor.getEmail()), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Mentee cancel >= 24h before startAt should trigger 100% refund")
    void menteeCancelAbove24Hours() {
        Instant startAt = Instant.now().plus(Duration.ofHours(30));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));
        when(escrowService.refundEscrowWithPenalty(eq(booking), eq(1.0), anyString()))
                .thenReturn(dummyResponse());

        bookingService.cancel(mentee, booking.getId());

        verify(escrowService).refundEscrowWithPenalty(eq(booking), eq(1.0), anyString());
        verify(mailService).sendCancellationNotification(eq(mentor.getEmail()), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Reschedule under 12 hours should be rejected")
    void rescheduleUnder12HoursShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofHours(6));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        RescheduleRequest req = new RescheduleRequest(Instant.now().plus(Duration.ofDays(2)));
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), req)
        );
        assertTrue(ex.getMessage().contains("12 giờ"));
    }

    @Test
    @DisplayName("Reschedule exceeds 2 times limit should be rejected")
    void rescheduleExceedLimitShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofDays(3));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 2);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        RescheduleRequest req = new RescheduleRequest(Instant.now().plus(Duration.ofDays(4)));
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), req)
        );
        assertTrue(ex.getMessage().contains("tối đa 2 lần"));
    }

    @Test
    @DisplayName("Reschedule >= 24h should directly apply new time and increment rescheduleCount")
    void rescheduleAbove24HoursDirectSuccess() {
        Instant startAt = Instant.now().plus(Duration.ofDays(2));
        Instant newStart = Instant.now().plus(Duration.ofDays(4));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.findByMentorIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByMenteeIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));

        bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart));

        assertEquals(newStart, booking.getStartAt());
        assertEquals(startAt, booking.getRescheduledFrom());
        assertEquals(1, booking.getRescheduleCount());
        assertNull(booking.getPendingStartAt());
        verify(mailService).sendRescheduleNotificationToMentor(any(), any(), any(), any(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Reschedule 12h-24h should set pendingStartAt and not change startAt immediately")
    void rescheduleBetween12And24HoursSetsPending() {
        Instant startAt = Instant.now().plus(Duration.ofHours(18));
        Instant newStart = Instant.now().plus(Duration.ofDays(3));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.findByMentorIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByMenteeIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));

        bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart));

        assertEquals(startAt, booking.getStartAt()); // Not changed yet!
        assertEquals(newStart, booking.getPendingStartAt());
        assertEquals(0, booking.getRescheduleCount()); // Not incremented yet!
        verify(mailService).sendRescheduleRequestToMentor(any(), any(), any(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Mentor accepts reschedule should apply pendingStartAt and increment count")
    void mentorAcceptsReschedule() {
        Instant startAt = Instant.now().plus(Duration.ofHours(18));
        Instant pendingStart = Instant.now().plus(Duration.ofDays(3));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);
        booking.setPendingStartAt(pendingStart);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.findByMentorIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByMenteeIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.findById(menteeId.toHexString())).thenReturn(Optional.of(mentee));

        bookingService.respondReschedule(mentor, booking.getId(), new RescheduleRespondRequest(true, "OK"));

        assertEquals(pendingStart, booking.getStartAt());
        assertEquals(startAt, booking.getRescheduledFrom());
        assertNull(booking.getPendingStartAt());
        assertEquals(1, booking.getRescheduleCount());
        verify(mailService).sendRescheduleResponseToMentee(any(), any(), any(), any(), any(), eq(true), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Mentor declines reschedule should clear pendingStartAt without changing startAt")
    void mentorDeclinesReschedule() {
        Instant startAt = Instant.now().plus(Duration.ofHours(18));
        Instant pendingStart = Instant.now().plus(Duration.ofDays(3));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);
        booking.setPendingStartAt(pendingStart);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(userRepository.findById(menteeId.toHexString())).thenReturn(Optional.of(mentee));

        bookingService.respondReschedule(mentor, booking.getId(), new RescheduleRespondRequest(false, "Busy"));

        assertEquals(startAt, booking.getStartAt()); // remains
        assertNull(booking.getPendingStartAt()); // cleared
        assertEquals(0, booking.getRescheduleCount());
        verify(mailService).sendRescheduleResponseToMentee(any(), any(), any(), any(), any(), eq(false), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Mentee cancel in ESCROW_HELD (Mentor not yet accepted) should trigger 100% refund without penalty")
    void menteeCancelEscrowHeldBetween12And24HoursShouldBe100Percent() {
        Instant startAt = Instant.now().plus(Duration.ofHours(18));
        Booking booking = createBooking(startAt, BookingStatus.ESCROW_HELD, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));
        when(escrowService.refundEscrowWithPenalty(eq(booking), eq(1.0), anyString()))
                .thenReturn(dummyResponse());

        bookingService.cancel(mentee, booking.getId());

        verify(escrowService).refundEscrowWithPenalty(eq(booking), eq(1.0), anyString());
        verify(mailService).sendCancellationNotification(eq(mentor.getEmail()), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Reschedule >= 24h oldStart but newStart is under 24h should require mentor approval")
    void rescheduleAbove24HoursWithNewStartUnder24HoursSetsPending() {
        Instant startAt = Instant.now().plus(Duration.ofDays(2));
        Instant newStart = Instant.now().plus(Duration.ofHours(5)); // < 24h!
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(bookingRepository.findByMentorIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByMenteeIdAndStatusIn(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.findById(mentorId.toHexString())).thenReturn(Optional.of(mentor));

        bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart));

        assertEquals(startAt, booking.getStartAt()); // Not changed yet!
        assertEquals(newStart, booking.getPendingStartAt());
        assertEquals(0, booking.getRescheduleCount());
        verify(mailService).sendRescheduleRequestToMentor(any(), any(), any(), any(), any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Reschedule beyond 30 days should be rejected")
    void rescheduleBeyond30DaysShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofDays(2));
        Instant newStart = Instant.now().plus(Duration.ofDays(35));
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart))
        );
        assertTrue(ex.getMessage().contains("30 ngày"));
    }

    @Test
    @DisplayName("Reschedule outside Mentor availability should be rejected")
    void rescheduleOutsideAvailabilityShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofDays(2));
        // Pick Sunday 14:00 (Vietnam timezone)
        Instant newStart = Instant.parse("2026-10-11T07:00:00Z"); // Sunday 14:00 GMT+7
        Booking booking = createBooking(startAt, BookingStatus.ACCEPTED, 0);

        MentorProfile profile = MentorProfile.builder()
                .userId(mentorId)
                .availability(java.util.Map.of("Monday", List.of("08:00", "09:00")))
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(mentorRepository.findByUserId(mentorId)).thenReturn(Optional.of(profile));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart))
        );
        assertTrue(ex.getMessage().contains("lịch rảnh"));
    }

    @Test
    @DisplayName("Reschedule session where duration exceeds Mentor availability window should be rejected")
    void rescheduleExceedingAvailabilityDurationShouldThrow() {
        Instant startAt = Instant.now().plus(Duration.ofDays(2));
        // Pick Monday 08:00 (Vietnam timezone)
        // 2026-10-12 is Monday. 08:00 GMT+7 is 01:00 UTC.
        Instant newStart = Instant.parse("2026-10-12T01:00:00Z");
        // Booking with duration 120 minutes (2 hours)
        Booking booking = Booking.builder()
                .id(new ObjectId().toHexString())
                .menteeId(new ObjectId(mentee.getId()))
                .mentorId(mentorId)
                .courseCode("EXE101")
                .startAt(startAt)
                .durationMin(120) // 2 hours!
                .price(100_000L)
                .status(BookingStatus.ACCEPTED)
                .rescheduleCount(0)
                .build();

        // Mentor is ONLY available at 08:00 (covers 08:00 - 09:00, missing 09:00)
        MentorProfile profile = MentorProfile.builder()
                .userId(mentorId)
                .availability(java.util.Map.of("Monday", List.of("08:00")))
                .build();

        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(mentorRepository.findByUserId(mentorId)).thenReturn(Optional.of(profile));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), new RescheduleRequest(newStart))
        );
        assertTrue(ex.getMessage().contains("vượt quá khung giờ rảnh") || ex.getMessage().contains("không có sẵn"));
    }
}
