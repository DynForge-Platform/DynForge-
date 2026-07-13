package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank String recipientId,
        @NotBlank @Size(max = 2000) String content
) {
}
