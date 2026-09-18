package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String fullName,
        String phone,
        String studentId,
        String major,
        String year,
        String avatarUrl
) {
}
