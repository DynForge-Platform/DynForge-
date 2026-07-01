package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;

public record VerificationDecisionRequest(
        @NotNull VerificationStatus status,
        String note
) {
}
