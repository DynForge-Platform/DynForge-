package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotBlank;

/** ID token (credential) returned by Google Identity Services on the frontend. */
public record GoogleLoginRequest(@NotBlank String idToken) {}
