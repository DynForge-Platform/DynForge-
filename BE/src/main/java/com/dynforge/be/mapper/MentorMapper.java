package com.dynforge.be.mapper;

import com.dynforge.be.model.dto.MentorProfileResponse;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.User;
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
                profile.getMajor(),
                profile.getUniversity(),
                profile.getTeachingRole(),
                profile.getCourses(),
                profile.getSkills(),
                profile.getLanguages(),
                profile.getFormats(),
                profile.getAvailability(),
                profile.isVerified(),
                profile.getRatingAvg(),
                profile.getRatingCount(),
                profile.getSessionsCount()
        );
    }
}
