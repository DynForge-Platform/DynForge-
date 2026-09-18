package com.dynforge.be.model.dto;

import java.time.Instant;

public record MessageResponse(
        String id,
        String senderId,
        String recipientId,
        String content,
        boolean mine,
        boolean read,
        Instant createdAt
) {
}
