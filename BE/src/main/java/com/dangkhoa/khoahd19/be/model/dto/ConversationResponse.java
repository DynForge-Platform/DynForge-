package com.dangkhoa.khoahd19.be.model.dto;

import java.time.Instant;

public record ConversationResponse(
        String userId,
        String name,
        String avatarUrl,
        String lastMessage,
        Instant lastAt,
        long unreadCount
) {
}
