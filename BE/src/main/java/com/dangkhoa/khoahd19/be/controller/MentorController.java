package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.dto.MentorProfileRequest;
import com.dangkhoa.khoahd19.be.model.dto.MentorProfileResponse;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.MentorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @GetMapping
    public ApiResponse<List<MentorProfileResponse>> list(
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String format,
            @RequestParam(required = false) Boolean verified
    ) {
        return ApiResponse.ok(mentorService.listMentors(course, format, verified));
    }

    @GetMapping("/me")
    public ApiResponse<MentorProfileResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(mentorService.getOwnProfile(principal.getUser()));
    }

    @PutMapping("/me")
    public ApiResponse<MentorProfileResponse> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MentorProfileRequest request
    ) {
        return ApiResponse.ok("Profile updated", mentorService.upsertOwnProfile(principal.getUser(), request));
    }

    @GetMapping("/{id}")
    public ApiResponse<MentorProfileResponse> getById(@PathVariable String id) {
        return ApiResponse.ok(mentorService.getById(id));
    }
}
