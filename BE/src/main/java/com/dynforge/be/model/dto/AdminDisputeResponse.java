package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.BookingStatus;

import java.time.Instant;

public record AdminDisputeResponse(
        String bookingId,
        String menteeId,
        String menteeName,
        String mentorId,
        String mentorName,
        String courseCode,
        long price,
        BookingStatus status,
        String issueType,
        String reason,
        Instant startAt,
        Instant createdAt
) {
}
