package com.dynforge.be.model.dto;

import com.dynforge.be.model.entity.Course;

import java.util.List;
import java.util.Map;

public record MentorProfileResponse(
        String id,
        String userId,
        String fullName,
        String avatarUrl,
        String title,
        String bio,
        String major,
        String university,
        String teachingRole,
        List<Course> courses,
        List<String> skills,
        List<String> languages,
        List<String> formats,
        Map<String, List<String>> availability,
        boolean verified,
        double ratingAvg,
        int ratingCount,
        int sessionsCount
) {
}
