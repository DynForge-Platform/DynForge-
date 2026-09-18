package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.VerificationStatus;

import java.time.Instant;

public record VerificationResponse(
        String id,
        String userId,
        String userName,
        String avatarUrl,
        String course,
        String claimedGrade,
        String transcriptUrl,
        VerificationStatus status,
        String reviewedBy,
        Instant reviewedAt,
        String note,
        Instant createdAt
) {
}
