package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.entity.Course;

import java.util.List;
import java.util.Map;

public record MentorProfileRequest(
        String title,
        String bio,
        String major,
        String university,
        String teachingRole,
        List<Course> courses,
        List<String> skills,
        List<String> languages,
        List<String> formats,
        Map<String, List<String>> availability
) {
}
