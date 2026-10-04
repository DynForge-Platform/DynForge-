package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.testutil.BaseMongoIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class CancellationTimelineIntegrationTest extends BaseMongoIntegrationTest {

    @Test
    @DisplayName("Mentee cancel at 25h before startAt: 100% refund to Mentee, money conserved")
    void testCancelAt25h() {
        User mentee = createMentee("Mentee A", "mentee25h@test.com", 0L);
        User mentor = createMentor("Mentor A", "mentor25h@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // Current time = 25h before startAt
        mutableClock.setInstant(startAt.minus(25, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentee, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance());
        assertEquals(0L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Mentee cancel at exactly 24h before startAt: 100% refund to Mentee, money conserved")
    void testCancelAt24h() {
        User mentee = createMentee("Mentee B", "mentee24h@test.com", 0L);
        User mentor = createMentor("Mentor B", "mentor24h@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // Current time = exactly 24h before startAt
        mutableClock.setInstant(startAt.minus(24, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentee, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance());
        assertEquals(0L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Mentee cancel at 24h - 1s (23h59m59s) before startAt: 70% refund to Mentee, 30% gross to Mentor minus 15% commission")
    void testCancelAt24hMinusOneSecond() {
        User mentee = createMentee("Mentee C", "mentee24hminus1s@test.com", 0L);
        User mentor = createMentor("Mentor C", "mentor24hminus1s@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // 24h minus 1 second
        mutableClock.setInstant(startAt.minus(24, ChronoUnit.HOURS).plusSeconds(1));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentee, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(70_000L, updatedMentee.getWalletBalance());
        // 30,000 gross - 15% commission (4,500) = 25,500 net
        assertEquals(25_500L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Mentee cancel at 18h before startAt: 70% refund to Mentee, 30% gross to Mentor minus 15% commission")
    void testCancelAt18h() {
        User mentee = createMentee("Mentee D", "mentee18h@test.com", 0L);
        User mentor = createMentor("Mentor D", "mentor18h@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        mutableClock.setInstant(startAt.minus(18, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentee, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(70_000L, updatedMentee.getWalletBalance());
        assertEquals(25_500L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Mentee cancel at 6h before startAt: Rejected (<12h), money conserved")
    void testCancelAt6hRejected() {
        User mentee = createMentee("Mentee E", "mentee6h@test.com", 0L);
        User mentor = createMentor("Mentor E", "mentor6h@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        mutableClock.setInstant(startAt.minus(6, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            assertThrows(BadRequestException.class, () ->
                    bookingService.cancel(mentee, booking.getId())
            );
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(0L, updatedMentee.getWalletBalance());
        assertEquals(0L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.ACCEPTED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.HELD, updatedEscrow.getStatus());
    }

    @Test
    @DisplayName("Mentor cancel: 100% refund to Mentee, mentorCancelCount incremented, money conserved")
    void testMentorCancel() {
        User mentee = createMentee("Mentee F", "menteementorcancel@test.com", 0L);
        User mentor = createMentor("Mentor F", "mentorcancel@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        mutableClock.setInstant(startAt.minus(5, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentor, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();
        MentorProfile updatedProfile = mentorRepository.findByUserId(new org.bson.types.ObjectId(mentor.getId())).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance());
        assertEquals(0L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
        assertEquals(1, updatedProfile.getMentorCancelCount());
    }

    @Test
    @DisplayName("Mentee cancel at 18h before startAt when ESCROW_HELD: 100% refund to Mentee (Mentor hasn't accepted), money conserved")
    void testCancelAt18hWhenEscrowHeld() {
        User mentee = createMentee("Mentee 18h Escrow", "mentee18hescrow@test.com", 0L);
        User mentor = createMentor("Mentor 18h Escrow", "mentor18hescrow@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-10T10:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ESCROW_HELD, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        mutableClock.setInstant(startAt.minus(18, ChronoUnit.HOURS));

        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            bookingService.cancel(mentee, booking.getId());
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        User updatedMentor = userRepository.findById(mentor.getId()).orElseThrow();
        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();

        assertEquals(100_000L, updatedMentee.getWalletBalance());
        assertEquals(0L, updatedMentor.getWalletBalance());
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus());
    }
}
