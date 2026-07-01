package com.dangkhoa.khoahd19.be.model.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
