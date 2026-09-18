package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
        String issueType,
        @NotBlank @Size(max = 2000) String reason
) {
}
