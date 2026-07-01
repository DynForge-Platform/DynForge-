package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WebhookRequest(
        @NotBlank String txnRef,
        @NotNull WebhookStatus status
) {
    public enum WebhookStatus {
        SUCCESS,
        FAILED
    }
}
