package com.dangkhoa.khoahd19.be.model.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
