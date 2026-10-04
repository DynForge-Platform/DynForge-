package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerificationRequestDto(
        @NotBlank String course,
        @NotBlank @Pattern(regexp = "A|A\\+", message = "claimedGrade must be \"A\" or \"A+\"") String claimedGrade,
        String transcriptUrl,
        String alumniProofUrl
) {
    public VerificationRequestDto(String course, String claimedGrade, String transcriptUrl) {
        this(course, claimedGrade, transcriptUrl, null);
    }
}
