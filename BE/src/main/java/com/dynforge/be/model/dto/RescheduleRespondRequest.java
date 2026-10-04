package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotNull;

public record RescheduleRespondRequest(
        @NotNull(message = "Trường 'accept' không được để trống")
        Boolean accept,
        String note
) {
}
