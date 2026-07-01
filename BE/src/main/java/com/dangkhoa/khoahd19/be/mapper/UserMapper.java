package com.dangkhoa.khoahd19.be.mapper;

import com.dangkhoa.khoahd19.be.model.dto.UserResponse;
import com.dangkhoa.khoahd19.be.model.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRoles(),
                user.getStudentId(),
                user.getMajor(),
                user.getYear(),
                user.getAvatarUrl(),
                user.getWalletBalance(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
