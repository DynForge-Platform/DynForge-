package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;

import java.time.Instant;

public record BookingResponse(
        String id,
        String menteeId,
        String mentorId,
        String menteeName,
        String mentorName,
        String courseCode,
        BookingFormat format,
        Instant startAt,
        int durationMin,
        long price,
        double commissionRate,
        BookingStatus status,
        String escrowTxnId,
        Instant createdAt,
        Instant acceptedAt,
        Instant taughtAt,
        String disputeIssueType,
        String disputeReason
) {
}
