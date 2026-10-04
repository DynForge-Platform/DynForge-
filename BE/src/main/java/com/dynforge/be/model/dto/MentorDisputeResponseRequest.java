package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MentorDisputeResponseRequest(
        @NotBlank @Size(max = 2000) String response,
        @Size(max = 1000) String evidenceUrl
) {
}
