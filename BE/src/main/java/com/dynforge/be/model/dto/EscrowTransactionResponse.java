package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.EscrowStatus;

import java.time.Instant;

public record EscrowTransactionResponse(
        String id,
        String bookingId,
        long totalAmount,
        double commissionRate,
        long commissionAmount,
        long mentorPayout,
        EscrowStatus status,
        Instant heldAt,
        Instant releasedAt
) {
}
