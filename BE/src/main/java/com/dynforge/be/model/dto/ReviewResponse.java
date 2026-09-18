package com.dynforge.be.model.dto;

import java.time.Instant;

public record ReviewResponse(
        String id,
        String bookingId,
        String menteeId,
        String menteeName,
        String menteeAvatar,
        String mentorId,
        String courseCode,
        int rating,
        String comment,
        Instant createdAt
) {
}
