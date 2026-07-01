package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.mapper.BookingMapper;
import com.dangkhoa.khoahd19.be.model.dto.BookingResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.entity.EscrowTransaction;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.entity.WalletTransaction;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;
import com.dangkhoa.khoahd19.be.model.enums.EscrowStatus;
import com.dangkhoa.khoahd19.be.model.enums.TransactionStatus;
import com.dangkhoa.khoahd19.be.model.enums.TransactionType;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.repository.EscrowTransactionRepository;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import com.dangkhoa.khoahd19.be.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class EscrowService {

    private final BookingRepository bookingRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final WalletTransactionRepository walletTxnRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;

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

        mentee.setWalletBalance(mentee.getWalletBalance() - total);
        userRepository.save(mentee);

        recordWalletTxn(mentee.getId(), TransactionType.PAYMENT, total,
                "Payment for booking " + bookingId, bookingId);

        EscrowTransaction escrow = escrowRepository.save(EscrowTransaction.builder()
                .bookingId(new ObjectId(bookingId))
                .menteeId(new ObjectId(mentee.getId()))
                .mentorId(booking.getMentorId())
                .totalAmount(total)
                .commissionRate(rate)
                .commissionAmount(commission)
                .mentorPayout(payout)
                .status(EscrowStatus.HELD)
                .heldAt(Instant.now())
                .build());

        booking.setEscrowTxnId(new ObjectId(escrow.getId()));
        booking.setStatus(BookingStatus.ESCROW_HELD);
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    // ── mark-taught (mentor) ─────────────────────────────────────────────────

    public BookingResponse markTaught(User mentor, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMentorId().toHexString().equals(mentor.getId())) {
            throw new BadRequestException("Only the mentor can mark this session as taught");
        }
        requireStatus(booking, BookingStatus.ESCROW_HELD);

        booking.setStatus(BookingStatus.TAUGHT);
        booking.setTaughtAt(Instant.now());
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    // ── confirm (mentee) → COMPLETED + release ───────────────────────────────

    public BookingResponse confirmAndRelease(User mentee, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee can confirm this booking");
        }
        requireStatus(booking, BookingStatus.TAUGHT);

        return releaseEscrow(booking);
    }

    // ── dispute (mentee) ─────────────────────────────────────────────────────

    public BookingResponse dispute(User mentee, String bookingId) {
        Booking booking = requireBooking(bookingId);

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee can open a dispute");
        }
        requireStatus(booking, BookingStatus.TAUGHT);

        booking.setStatus(BookingStatus.DISPUTED);
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    // ── resolve dispute (admin) ───────────────────────────────────────────────

    public BookingResponse resolveDispute(String bookingId, boolean releaseToMentor) {
        Booking booking = requireBooking(bookingId);
        requireStatus(booking, BookingStatus.DISPUTED);

        return releaseToMentor ? releaseEscrow(booking) : refundEscrow(booking);
    }

    // ── auto-confirm (called by scheduler) ───────────────────────────────────

    public void autoConfirm(String bookingId) {
        Booking booking = requireBooking(bookingId);
        if (booking.getStatus() != BookingStatus.TAUGHT) return;
        try {
            releaseEscrow(booking);
            log.info("Auto-confirmed booking {}", bookingId);
        } catch (Exception e) {
            log.error("Auto-confirm failed for booking {}: {}", bookingId, e.getMessage());
        }
    }

    // ── internals ────────────────────────────────────────────────────────────

    private BookingResponse releaseEscrow(Booking booking) {
        EscrowTransaction escrow = requireEscrow(booking.getId());

        escrow.setStatus(EscrowStatus.RELEASED);
        escrow.setReleasedAt(Instant.now());
        escrowRepository.save(escrow);

        User mentor = requireUser(escrow.getMentorId().toHexString());
        mentor.setWalletBalance(mentor.getWalletBalance() + escrow.getMentorPayout());
        userRepository.save(mentor);

        recordWalletTxn(mentor.getId(), TransactionType.PAYOUT, escrow.getMentorPayout(),
                "Payout for booking " + booking.getId(), booking.getId());

        booking.setStatus(BookingStatus.COMPLETED);
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    private BookingResponse refundEscrow(Booking booking) {
        EscrowTransaction escrow = requireEscrow(booking.getId());

        escrow.setStatus(EscrowStatus.REFUNDED);
        escrow.setReleasedAt(Instant.now());
        escrowRepository.save(escrow);

        User mentee = requireUser(escrow.getMenteeId().toHexString());
        mentee.setWalletBalance(mentee.getWalletBalance() + escrow.getTotalAmount());
        userRepository.save(mentee);

        recordWalletTxn(mentee.getId(), TransactionType.REFUND, escrow.getTotalAmount(),
                "Refund for booking " + booking.getId(), booking.getId());

        booking.setStatus(BookingStatus.REFUNDED);
        return bookingMapper.toResponse(bookingRepository.save(booking));
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
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
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

    private User requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private void requireStatus(Booking booking, BookingStatus expected) {
        if (booking.getStatus() != expected) {
            throw new BadRequestException(
                    "Expected booking status " + expected + " but was " + booking.getStatus());
        }
    }
}
