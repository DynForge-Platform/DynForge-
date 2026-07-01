package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.TransactionStatus;
import com.dangkhoa.khoahd19.be.model.enums.TransactionType;

import java.time.Instant;

public record TransactionResponse(
        String id,
        TransactionType type,
        TransactionStatus status,
        long amount,
        String description,
        String relatedBookingId,
        Instant createdAt
) {
}
