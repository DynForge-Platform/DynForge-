package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.entity.Course;

import java.util.List;
import java.util.Map;

public record MentorProfileResponse(
        String id,
        String userId,
        String fullName,
        String avatarUrl,
        String title,
        String bio,
        List<Course> courses,
        List<String> skills,
        List<String> languages,
        Map<String, List<String>> availability,
        boolean verified,
        double ratingAvg,
        int ratingCount,
        int sessionsCount
) {
}
