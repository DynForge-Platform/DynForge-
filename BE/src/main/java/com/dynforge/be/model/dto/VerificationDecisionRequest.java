package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;

public record VerificationDecisionRequest(
        @NotNull VerificationStatus status,
        String note
) {
}
