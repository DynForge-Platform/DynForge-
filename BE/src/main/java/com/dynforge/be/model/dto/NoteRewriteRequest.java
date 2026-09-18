package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotBlank;

/** Raw in-meeting notes the participant wants AI to restructure. */
public record NoteRewriteRequest(@NotBlank String notes) {}
