package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.BookingFormat;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;

import java.time.Instant;

public record BookingResponse(
        String id,
        String menteeId,
        String mentorId,
        String courseCode,
        BookingFormat format,
        Instant startAt,
        int durationMin,
        long price,
        double commissionRate,
        BookingStatus status,
        String escrowTxnId,
        Instant createdAt,
        Instant taughtAt
) {
}
