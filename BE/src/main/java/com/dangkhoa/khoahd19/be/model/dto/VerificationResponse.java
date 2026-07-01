package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.VerificationStatus;

import java.time.Instant;

public record VerificationResponse(
        String id,
        String userId,
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
