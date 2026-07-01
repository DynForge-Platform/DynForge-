package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.entity.Course;

import java.util.List;
import java.util.Map;

public record MentorProfileRequest(
        String title,
        String bio,
        List<Course> courses,
        List<String> skills,
        List<String> languages,
        Map<String, List<String>> availability
) {
}
