package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.model.dto.BookingRequest;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.testutil.BaseMongoIntegrationTest;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class ConcurrencyAndRollbackIntegrationTest extends BaseMongoIntegrationTest {

    @Test
    @DisplayName("Two concurrent pay requests when wallet only has balance for one: exactly 1 succeeds, wallet never negative, money conserved")
    void testConcurrentPaySingleBalance() throws InterruptedException {
        User mentee = createMentee("Mentee ConcurrentPay", "mentee_pay@test.com", 100_000L);
        User mentor = createMentor("Mentor ConcurrentPay", "mentor_pay@test.com", 0L, 100_000L);

        Instant startAt1 = Instant.parse("2026-10-15T10:00:00Z");
        Instant startAt2 = Instant.parse("2026-10-16T10:00:00Z");

        Booking b1 = createBooking(mentee, mentor, startAt1, 60, BookingStatus.PENDING_PAYMENT, 100_000L, 0.15);
        Booking b2 = createBooking(mentee, mentor, startAt2, 60, BookingStatus.PENDING_PAYMENT, 100_000L, 0.15);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        executor.submit(() -> {
            try {
                startGate.await();
                escrowService.pay(mentee, b1.getId());
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneGate.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startGate.await();
                escrowService.pay(mentee, b2.getId());
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneGate.countDown();
            }
        });

        startGate.countDown();
        boolean completed = doneGate.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertTrue(completed, "Concurrent pay operations did not complete in time");

        assertEquals(1, successCount.get(), "Exactly one pay request must succeed");
        assertEquals(1, failCount.get(), "Exactly one pay request must fail due to insufficient balance");

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        assertEquals(0L, updatedMentee.getWalletBalance(), "Mentee wallet must be 0 and never negative");
        assertTrue(updatedMentee.getWalletBalance() >= 0L, "Mentee wallet balance cannot be negative");

        // Money conservation check: total system money must still equal 100,000 (held in escrow)
        SystemMoneyState state = getMoneyState(mentee.getId(), mentor.getId());
        assertEquals(100_000L, state.total, "Total money must be conserved");
        assertEquals(100_000L, state.heldEscrow, "100,000 must be held in escrow");
    }

    @Test
    @DisplayName("Pay error midway rolls back: wallet balance restored, escrow deleted, money conserved")
    void testPayMidwayErrorRollback() {
        User mentee = createMentee("Mentee Rollback", "mentee_rb@test.com", 100_000L);
        User mentor = createMentor("Mentor Rollback", "mentor_rb@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-15T14:00:00Z");
        // Create booking in PENDING_PAYMENT
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.PENDING_PAYMENT, 100_000L, 0.15);

        // Before pay executes findAndModify on booking, let's simulate the booking being CANCELLED concurrently
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(new ObjectId(booking.getId()))),
                new Update().set("status", BookingStatus.CANCELLED),
                Booking.class
        );

        // Now call pay: initial requireStatus checks mentee's memory object (if from DB) or findAndModify fails
        assertMoneyConserved(mentee.getId(), mentor.getId(), () -> {
            assertThrows(BadRequestException.class, () -> escrowService.pay(mentee, booking.getId()));
        });

        User updatedMentee = userRepository.findById(mentee.getId()).orElseThrow();
        assertEquals(100_000L, updatedMentee.getWalletBalance(), "Wallet balance must remain fully rolled back to 100,000");

        // Ensure no stray escrow transaction was left
        boolean hasHeldEscrow = escrowRepository.findAll().stream()
                .anyMatch(e -> e.getBookingId().equals(new ObjectId(booking.getId())));
        assertFalse(hasHeldEscrow, "No escrow transaction should exist after rollback");
    }

    @Test
    @DisplayName("Cancel and auto-confirm concurrently does not refund or payout twice, money conserved")
    void testCancelAndAutoConfirmConcurrentlyNoDoubleRefund() throws InterruptedException {
        User mentee = createMentee("Mentee ConcurCancel", "mentee_cac@test.com", 0L);
        User mentor = createMentor("Mentor ConcurCancel", "mentor_cac@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-15T16:00:00Z");
        Booking booking = createBooking(mentee, mentor, startAt, 60, BookingStatus.ACCEPTED, 100_000L, 0.15);
        EscrowTransaction escrow = createEscrow(booking, EscrowStatus.HELD);

        // 25h before startAt, so mentee cancellation is valid (100% refund)
        mutableClock.setInstant(startAt.minus(25, ChronoUnit.HOURS));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(2);

        executor.submit(() -> {
            try {
                startGate.await();
                // autoConfirm tries to confirm (requires TAUGHT)
                escrowService.autoConfirm(booking.getId());
            } catch (Exception ignored) {
            } finally {
                doneGate.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startGate.await();
                // mentee attempts cancel (valid for ACCEPTED at 25h before start)
                bookingService.cancel(mentee, booking.getId());
            } catch (Exception ignored) {
            } finally {
                doneGate.countDown();
            }
        });

        startGate.countDown();
        boolean completed = doneGate.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertTrue(completed);

        // Money conservation check: total system money must equal 100,000
        SystemMoneyState state = getMoneyState(mentee.getId(), mentor.getId());
        assertEquals(100_000L, state.total, "Money must be strictly conserved without double payout or double refund");

        // Escrow must NOT be HELD
        EscrowTransaction updatedEscrow = escrowRepository.findById(escrow.getId()).orElseThrow();
        assertEquals(EscrowStatus.REFUNDED, updatedEscrow.getStatus(), "Escrow must be REFUNDED, not HELD or duplicate");

        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.CANCELLED, updatedBooking.getStatus());
        assertEquals(100_000L, userRepository.findById(mentee.getId()).orElseThrow().getWalletBalance());
        assertEquals(0L, userRepository.findById(mentor.getId()).orElseThrow().getWalletBalance());
    }

    @Test
    @DisplayName("Two concurrent bookings for overlapping timeslot: distributed lock prevents double booking")
    void testConcurrentBookingScheduleConflict() throws InterruptedException {
        User mentee1 = createMentee("Mentee Concur1", "mentee_c1@test.com", 200_000L);
        User mentee2 = createMentee("Mentee Concur2", "mentee_c2@test.com", 200_000L);
        User mentor = createMentor("Mentor Conflicted", "mentor_conf@test.com", 0L, 100_000L);

        Instant startAt = Instant.parse("2026-10-20T09:00:00Z");
        mutableClock.setInstant(Instant.parse("2026-10-18T09:00:00Z"));

        BookingRequest req1 = new BookingRequest(
                mentor.getId(),
                "PRN211",
                BookingFormat.ONE_ON_ONE,
                startAt,
                60
        );
        BookingRequest req2 = new BookingRequest(
                mentor.getId(),
                "PRN211",
                BookingFormat.ONE_ON_ONE,
                startAt.plus(30, ChronoUnit.MINUTES), // Overlaps req1 (09:30 is within 09:00 - 10:00)
                60
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        executor.submit(() -> {
            try {
                startGate.await();
                bookingService.create(mentee1, req1);
                successCount.incrementAndGet();
            } catch (BadRequestException e) {
                conflictCount.incrementAndGet();
            } catch (Exception ignored) {
            } finally {
                doneGate.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startGate.await();
                bookingService.create(mentee2, req2);
                successCount.incrementAndGet();
            } catch (BadRequestException e) {
                conflictCount.incrementAndGet();
            } catch (Exception ignored) {
            } finally {
                doneGate.countDown();
            }
        });

        startGate.countDown();
        boolean completed = doneGate.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertTrue(completed);

        assertEquals(1, successCount.get(), "Exactly one booking must succeed");
        assertEquals(1, conflictCount.get(), "Overlapping concurrent booking must be rejected with conflict");

        // Verify only 1 booking was created in DB for this mentor
        long count = bookingRepository.findByMentorId(new ObjectId(mentor.getId())).size();
        assertEquals(1, count, "Only 1 booking must exist in database");
    }
}
