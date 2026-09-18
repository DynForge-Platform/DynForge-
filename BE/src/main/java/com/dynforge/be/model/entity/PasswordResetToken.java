package com.dynforge.be.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("password_reset_tokens")
public class PasswordResetToken {

    @Id
    private String id;

    @Indexed
    private String email;

    /** 6-digit one-time code. */
    private String otp;

    /** Set true once verify-otp succeeds; required before reset-password. */
    @Builder.Default
    private boolean verified = false;

    private Instant expiresAt;

    private Instant createdAt;
}
