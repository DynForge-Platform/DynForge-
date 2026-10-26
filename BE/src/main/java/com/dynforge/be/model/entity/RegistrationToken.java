package com.dynforge.be.model.entity;

import com.dynforge.be.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("registration_tokens")
public class RegistrationToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String fullName;

    private String passwordHash;

    private String phone;

    private Set<Role> roles;

    /** 6-digit one-time code (hashed). */
    private String otp;

    @Builder.Default
    private int failedAttempts = 0;

    private Instant expiresAt;

    private Instant createdAt;
}
