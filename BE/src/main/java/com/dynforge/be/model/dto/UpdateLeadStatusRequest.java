package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLeadStatusRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        String status,
        String adminNote
) {
}
