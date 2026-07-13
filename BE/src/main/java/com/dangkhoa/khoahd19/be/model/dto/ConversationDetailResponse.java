package com.dangkhoa.khoahd19.be.model.dto;

import java.util.List;

public record ConversationDetailResponse(
        UserBrief otherUser,
        List<MessageResponse> messages
) {
    public record UserBrief(String id, String name, String avatarUrl) {
    }
}
