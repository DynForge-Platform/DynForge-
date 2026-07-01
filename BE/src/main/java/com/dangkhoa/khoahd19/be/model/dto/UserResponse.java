package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.model.enums.UserStatus;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
        String id,
        String fullName,
        String email,
        String phone,
        Set<Role> roles,
        String studentId,
        String major,
        String year,
        String avatarUrl,
        long walletBalance,
        UserStatus status,
        Instant createdAt
) {
}
