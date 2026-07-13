package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;

/** A mentee's free-text description of what they need help with. */
public record MentorMatchRequest(@NotBlank String query) {}
