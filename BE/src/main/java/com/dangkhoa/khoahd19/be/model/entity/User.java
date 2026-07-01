package com.dangkhoa.khoahd19.be.model.entity;

import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.model.enums.UserStatus;
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
@Document("users")
public class User {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String phone;

    private String passwordHash;

    private Set<Role> roles;

    private String studentId;

    private String major;

    private String year;

    private String avatarUrl;

    @Builder.Default
    private long walletBalance = 0;

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    private Instant createdAt;
}
