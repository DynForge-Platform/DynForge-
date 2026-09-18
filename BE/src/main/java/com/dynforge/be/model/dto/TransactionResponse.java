package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.TransactionStatus;
import com.dynforge.be.model.enums.TransactionType;

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
