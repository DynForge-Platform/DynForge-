package com.dangkhoa.khoahd19.be.scheduler;

import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.service.EscrowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingAutoConfirmScheduler {

    private final BookingRepository bookingRepository;
    private final EscrowService escrowService;

    @Scheduled(fixedRate = 3_600_000) // every hour
    public void autoConfirmStaleTaughtBookings() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        List<Booking> stale = bookingRepository.findByStatusAndTaughtAtBefore(BookingStatus.TAUGHT, cutoff);

        if (!stale.isEmpty()) {
            log.info("Auto-confirm scheduler: found {} stale TAUGHT booking(s)", stale.size());
        }

        for (Booking booking : stale) {
            escrowService.autoConfirm(booking.getId());
        }
    }
}
