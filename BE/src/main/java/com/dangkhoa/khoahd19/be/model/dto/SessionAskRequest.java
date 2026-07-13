package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;

/** A mentee's follow-up question about a session. */
public record SessionAskRequest(@NotBlank String question) {}
