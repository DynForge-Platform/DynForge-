package com.dynforge.be.scheduler;

import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.BookingStatus;
import com.dynforge.be.model.enums.EscrowStatus;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.EscrowTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Periodic reconciliation audit job to detect:
 * 1. Escrow transactions in HELD status that do not match booking status.
 * 2. Bookings in terminal states (COMPLETED, CANCELLED, REFUNDED) whose escrow is still HELD.
 * 3. Users with negative wallet balances.
 *
 * NOTE: This job ONLY logs warnings and errors for administrator audit. It NEVER auto-modifies money.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReconciliationAuditScheduler {

    private static final Set<BookingStatus> VALID_HELD_BOOKING_STATUSES = EnumSet.of(
            BookingStatus.ESCROW_HELD,
            BookingStatus.ACCEPTED,
            BookingStatus.TAUGHT,
            BookingStatus.DISPUTED
    );

    private final EscrowTransactionRepository escrowRepository;
    private final BookingRepository bookingRepository;
    private final MongoTemplate mongoTemplate;

    @Scheduled(fixedRate = 3_600_000) // every hour
    @SchedulerLock(name = "reconciliationAudit", lockAtMostFor = "20m", lockAtLeastFor = "1m")
    public void runAudit() {
        log.info("[RECONCILIATION AUDIT] Starting periodic reconciliation audit run...");
        int anomalyCount = 0;

        // 1. Audit all HELD escrow transactions
        List<EscrowTransaction> heldEscrows = escrowRepository.findAll().stream()
                .filter(e -> e.getStatus() == EscrowStatus.HELD)
                .toList();

        for (EscrowTransaction escrow : heldEscrows) {
            if (escrow.getBookingId() == null) {
                log.warn("[RECONCILIATION AUDIT] Orphan escrow transaction without bookingId: Escrow ID: {}, Amount: {}",
                        escrow.getId(), escrow.getTotalAmount());
                anomalyCount++;
                continue;
            }

            Booking booking = bookingRepository.findById(escrow.getBookingId().toHexString()).orElse(null);
            if (booking == null) {
                log.warn("[RECONCILIATION AUDIT] Orphan Escrow! Escrow ID: {}, Amount: {}, Mentee: {}, Mentor: {} - Booking ID: {} NOT FOUND in database",
                        escrow.getId(), escrow.getTotalAmount(), escrow.getMenteeId(), escrow.getMentorId(), escrow.getBookingId());
                anomalyCount++;
            } else if (!VALID_HELD_BOOKING_STATUSES.contains(booking.getStatus())) {
                log.warn("[RECONCILIATION AUDIT] Escrow status mismatch! Escrow ID: {} is HELD, but Booking ID: {} has status: {}. Total amount: {}, Mentee: {}, Mentor: {}",
                        escrow.getId(), booking.getId(), booking.getStatus(), escrow.getTotalAmount(), escrow.getMenteeId(), escrow.getMentorId());
                anomalyCount++;
            }
        }

        // 2. Audit bookings in terminal states with lingering HELD escrow
        List<Booking> terminalBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED
                        || b.getStatus() == BookingStatus.CANCELLED
                        || b.getStatus() == BookingStatus.REFUNDED)
                .toList();

        for (Booking booking : terminalBookings) {
            if (booking.getEscrowTxnId() != null) {
                EscrowTransaction escrow = escrowRepository.findById(booking.getEscrowTxnId().toHexString()).orElse(null);
                if (escrow != null && escrow.getStatus() == EscrowStatus.HELD) {
                    log.warn("[RECONCILIATION AUDIT] Booking status mismatch! Booking ID: {} is {}, but associated Escrow ID: {} is still HELD! Total amount: {}",
                            booking.getId(), booking.getStatus(), escrow.getId(), escrow.getTotalAmount());
                    anomalyCount++;
                }
            }
        }

        // 3. Audit negative wallet balances
        Query negativeBalanceQuery = new Query(Criteria.where("walletBalance").lt(0));
        List<User> negativeUsers = mongoTemplate.find(negativeBalanceQuery, User.class);

        for (User user : negativeUsers) {
            log.warn("[RECONCILIATION AUDIT] Negative Wallet Balance Detected! User ID: {}, Email: {}, Balance: {} VNĐ",
                    user.getId(), user.getEmail(), user.getWalletBalance());
            anomalyCount++;
        }

        if (anomalyCount > 0) {
            log.warn("[RECONCILIATION AUDIT] Audit run finished with {} anomaly/anomalies detected. Review logs above.", anomalyCount);
        } else {
            log.info("[RECONCILIATION AUDIT] Audit run finished successfully. All escrow states, bookings, and wallet balances are consistent.");
        }
    }
}
