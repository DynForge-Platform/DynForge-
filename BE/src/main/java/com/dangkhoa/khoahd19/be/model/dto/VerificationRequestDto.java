package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerificationRequestDto(
        @NotBlank String course,
        @NotBlank @Pattern(regexp = "A|A\\+", message = "claimedGrade must be \"A\" or \"A+\"") String claimedGrade,
        String transcriptUrl
) {
}
