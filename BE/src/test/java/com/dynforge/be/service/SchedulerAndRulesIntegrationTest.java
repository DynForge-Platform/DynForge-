package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.model.dto.BookingRequest;
import com.dynforge.be.model.dto.RescheduleRequest;
import com.dynforge.be.model.dto.RescheduleRespondRequest;
import com.dynforge.be.model.entity.*;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.testutil.BaseMongoIntegrationTest;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SchedulerAndRulesIntegrationTest extends BaseMongoIntegrationTest {

    @Test
    @DisplayName("Scheduler: 30 minutes PENDING_PAYMENT timeout auto-cancels unpaid bookings")
    void testAutoCancelUnpaidBookingsScheduler() {
        User mentee = createMentee("Mentee Unpaid", "mentee_unpaid@test.com", 0L);
        User mentor = createMentor("Mentor Unpaid", "mentor_unpaid@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        // Booking 1: created 35 minutes ago (> 30 min)
        Booking b1 = createBooking(mentee, mentor, now.plus(Duration.ofDays(2)), 60, BookingStatus.PENDING_PAYMENT, 100_000L, 0.15);
        b1.setCreatedAt(now.minus(35, ChronoUnit.MINUTES));
        bookingRepository.save(b1);

        // Booking 2: created 10 minutes ago (< 30 min)
        Booking b2 = createBooking(mentee, mentor, now.plus(Duration.ofDays(2)), 60, BookingStatus.PENDING_PAYMENT, 100_000L, 0.15);
        b2.setCreatedAt(now.minus(10, ChronoUnit.MINUTES));
        bookingRepository.save(b2);

        scheduler.autoCancelUnpaidBookings();

        Booking updatedB1 = bookingRepository.findById(b1.getId()).orElseThrow();
        Booking updatedB2 = bookingRepository.findById(b2.getId()).orElseThrow();

        assertEquals(BookingStatus.CANCELLED, updatedB1.getStatus(), "Booking older than 30m must be cancelled");
        assertEquals(BookingStatus.PENDING_PAYMENT, updatedB2.getStatus(), "Booking younger than 30m must remain pending");
    }

    @Test
    @DisplayName("Scheduler: Mentor does not accept within 24h triggers auto-refund 100% to mentee")
    void testAutoRefundMentorNotAccept24h() {
        User mentee = createMentee("Mentee NotAccept24h", "mentee_na24h@test.com", 0L);
        User mentor = createMentor("Mentor NotAccept24h", "mentor_na24h@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        // Booking created 25h ago in ESCROW_HELD
        Booking booking = createBooking(mentee, mentor, now.plus(Duration.ofDays(3)), 60, BookingStatus.ESCROW_HELD, 100_000L, 0.15);
        booking.setCreatedAt(now.minus(25, ChronoUnit.HOURS));
        bookingRepository.save(booking);

        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            scheduler.autoRefundUnacceptedBookings();
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance(), "Mentee must be fully refunded");
        assertEquals(BookingStatus.REFUNDED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Scheduler: Mentor does not accept when session is < 2h away triggers auto-refund")
    void testAutoRefundMentorNotAcceptNearStart() {
        User mentee = createMentee("Mentee NearStart", "mentee_nearstart@test.com", 0L);
        User mentor = createMentor("Mentor NearStart", "mentor_nearstart@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        // Session starts in 1 hour (< 2h away), mentor still hasn't accepted
        Booking booking = createBooking(mentee, mentor, now.plus(1, ChronoUnit.HOURS), 60, BookingStatus.ESCROW_HELD, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            scheduler.autoRefundUnacceptedBookings();
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance(), "Mentee must be refunded when session is <2h away");
        assertEquals(BookingStatus.REFUNDED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Scheduler: No-show auto-refund without recording refunds Mentee and increments mentorNoShowCount")
    void testAutoRefundNoShowWithoutRecording() {
        User mentee = createMentee("Mentee NoShowNoRec", "mentee_nsnr@test.com", 0L);
        User mentor = createMentor("Mentor NoShowNoRec", "mentor_nsnr@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        // Session ended 25h ago (startAt = now - 26h, duration = 60 min -> endAt = now - 25h)
        Instant startAt = now.minus(26, ChronoUnit.HOURS);
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            scheduler.autoRefundNoShowBookings();
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();
        MentorProfile updatedMentorProfile = mentorRepository.findByUserId(new ObjectId(mentor.getId())).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance());
        assertEquals(BookingStatus.REFUNDED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
        assertEquals(1, updatedMentorProfile.getMentorNoShowCount(), "mentorNoShowCount must increment");
    }

    @Test
    @DisplayName("Scheduler: No-show WITH recording present shifts booking to DISPUTED for Admin review instead of auto-refund")
    void testNoShowWithRecordingShiftsToDisputed() {
        User mentee = createMentee("Mentee NoShowRec", "mentee_nsr@test.com", 0L);
        User mentor = createMentor("Mentor NoShowRec", "mentor_nsr@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        Instant startAt = now.minus(26, ChronoUnit.HOURS);
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // Save a recording for this booking
        Recording recording = Recording.builder()
                .bookingId(new ObjectId(booking.getId()))
                .filename("recording.mp4")
                .createdAt(startAt.plus(1, ChronoUnit.HOURS))
                .build();
        recordingRepository.save(recording);

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            scheduler.autoRefundNoShowBookings();
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();
        MentorProfile updatedMentorProfile = mentorRepository.findByUserId(new ObjectId(mentor.getId())).orElseThrow();

        assertEquals(0L, updatedMentee.getWalletBalance(), "Mentee must NOT be auto-refunded when recording is present");
        assertEquals(BookingStatus.DISPUTED, updatedBooking.getStatus(), "Booking must shift to DISPUTED");
        assertEquals("RECORDING_REVIEW", updatedBooking.getDisputeIssueType());
        assertEquals(EscrowStatus.HELD, updatedEscrow.getStatus(), "Escrow must remain HELD for Admin review");
        assertEquals(0, updatedMentorProfile.getMentorNoShowCount(), "mentorNoShowCount must not increment yet");
    }

    @Test
    @DisplayName("Scheduler: Auto-confirm 24h after session marked taught releases payout to Mentor")
    void testAutoConfirmStaleTaughtBookings() {
        User mentee = createMentee("Mentee StaleTaught", "mentee_st@test.com", 0L);
        User mentor = createMentor("Mentor StaleTaught", "mentor_st@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T12:00:00Z");
        mutableClock.setInstant(now);

        Instant startAt = now.minus(30, ChronoUnit.HOURS);
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.TAUGHT, 100_000L, 0.15);
        booking.setTaughtAt(now.minus(25, ChronoUnit.HOURS)); // taught > 24h ago
        bookingRepository.save(booking);

        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            scheduler.autoConfirmStaleTaughtBookings();
        });

        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        // Mentor gets 100,000 - 15% commission = 85,000
        assertEquals(85_000L, updatedMentor.getWalletBalance(), "Mentor must receive payout");
        assertEquals(BookingStatus.COMPLETED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.RELEASED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Dispute: opening dispute before startAt + 15 min is rejected, after +15 min succeeds")
    void testDisputeBeforeAndAfter15Min() {
        User mentee = createMentee("Mentee Dispute", "mentee_disp@test.com", 0L);
        User mentor = createMentor("Mentor Dispute", "mentor_disp@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // Test 1: Exactly 10 minutes after start (10:10 < 10:15) -> Rejected
        mutableClock.setInstant(startAt.plus(10, ChronoUnit.MINUTES));
        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            BadRequestException ex = assertThrows(BadRequestException.class, () ->
                    escrowService.dispute(mentee, booking.getId(), "MENTOR_ABSENT", "Mentor did not show up at 10:10")
            );
            assertTrue(ex.getMessage().contains("15 phút"));
        });

        // Test 2: Exactly 16 minutes after start (10:16 >= 10:15) -> Succeeds!
        mutableClock.setInstant(startAt.plus(16, ChronoUnit.MINUTES));
        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            escrowService.dispute(mentee, booking.getId(), "MENTOR_ABSENT", "Mentor still not here at 10:16");
        });

        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.DISPUTED, updatedBooking.getStatus());
    }

    @Test
    @DisplayName("Schedule conflict: creating a booking overlapping an existing booking is rejected")
    void testDoubleBookingConflictRejected() {
        User mentee1 = createMentee("Mentee DB1", "mentee_db1@test.com", 200_000L);
        User mentee2 = createMentee("Mentee DB2", "mentee_db2@test.com", 200_000L);
        User mentor = createMentor("Mentor DB", "mentor_db@test.com", 0L, 100_000L);

        Instant now = Instant.parse("2026-10-10T08:00:00Z");
        mutableClock.setInstant(now);

        Instant slotStart = Instant.parse("2026-10-12T14:00:00Z");
        // Mentee 1 creates booking 14:00 - 15:00
        BookingRequest req1 = new BookingRequest(mentor.getId(), "PRN211", BookingFormat.ONE_ON_ONE, slotStart, 60);
        bookingService.create(mentee1, req1);

        // Mentee 2 tries to book 14:30 - 15:30 (overlaps 14:00 - 15:00)
        BookingRequest req2 = new BookingRequest(mentor.getId(), "PRN211", BookingFormat.ONE_ON_ONE, slotStart.plus(30, ChronoUnit.MINUTES), 60);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> bookingService.create(mentee2, req2));
        assertTrue(ex.getMessage().contains("lịch dạy khác"));
    }

    @Test
    @DisplayName("Reschedule: 3rd attempt is rejected (max 2 allowed)")
    void testThirdRescheduleAttemptRejected() {
        User mentee = createMentee("Mentee Resched3", "mentee_rs3@test.com", 0L);
        User mentor = createMentor("Mentor Resched3", "mentor_rs3@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-20T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        booking.setRescheduleCount(2); // Already rescheduled 2 times
        bookingRepository.save(booking);

        // Time is 48h before startAt (valid window >= 24h)
        mutableClock.setInstant(startAt.minus(48, ChronoUnit.HOURS));

        RescheduleRequest req = new RescheduleRequest(startAt.plus(Duration.ofDays(2)));
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                bookingService.reschedule(mentee, booking.getId(), req)
        );
        assertTrue(ex.getMessage().contains("tối đa 2 lần"));
    }

    @Test
    @DisplayName("Reschedule in 12-24h window: sets pendingStartAt, requires Mentor approval")
    void testRescheduleBetween12And24HoursRequiresMentorApproval() {
        User mentee = createMentee("Mentee ReschedAppr", "mentee_rsa@test.com", 0L);
        User mentor = createMentor("Mentor ReschedAppr", "mentor_rsa@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-20T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        createEscrow(booking, EscrowStatus.HELD);

        // Current time is 18h before startAt (in 12-24h window)
        mutableClock.setInstant(startAt.minus(18, ChronoUnit.HOURS));

        Instant newTargetTime = startAt.plus(Duration.ofDays(2));
        RescheduleRequest req = new RescheduleRequest(newTargetTime);

        // Mentee requests reschedule: should set pendingStartAt
        bookingService.reschedule(mentee, booking.getId(), req);

        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(startAt, updatedBooking.getStartAt(), "startAt must not change yet");
        assertEquals(newTargetTime, updatedBooking.getPendingStartAt(), "pendingStartAt must be recorded");
        assertEquals(0, updatedBooking.getRescheduleCount(), "rescheduleCount must not increment before mentor acceptance");

        // Mentor accepts the reschedule request
        bookingService.respondReschedule(mentor, booking.getId(), new RescheduleRespondRequest(true, "I agree with new time"));

        Booking finalBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(newTargetTime, finalBooking.getStartAt(), "startAt must be updated to newTargetTime");
        assertNull(finalBooking.getPendingStartAt(), "pendingStartAt must be cleared after approval");
        assertEquals(1, finalBooking.getRescheduleCount(), "rescheduleCount must be incremented to 1");
    }
}
