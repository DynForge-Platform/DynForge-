package com.dangkhoa.khoahd19.be.mapper;

import com.dangkhoa.khoahd19.be.model.dto.MentorProfileResponse;
import com.dangkhoa.khoahd19.be.model.entity.MentorProfile;
import com.dangkhoa.khoahd19.be.model.entity.User;
import org.springframework.stereotype.Component;

@Component
public class MentorMapper {

    public MentorProfileResponse toResponse(MentorProfile profile, User user) {
        return new MentorProfileResponse(
                profile.getId(),
                profile.getUserId().toHexString(),
                user.getFullName(),
                user.getAvatarUrl(),
                profile.getTitle(),
                profile.getBio(),
                profile.getCourses(),
                profile.getSkills(),
                profile.getLanguages(),
                profile.getAvailability(),
                profile.isVerified(),
                profile.getRatingAvg(),
                profile.getRatingCount(),
                profile.getSessionsCount()
        );
    }
}
