package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.dto.MentorMatchRequest;
import com.dangkhoa.khoahd19.be.model.dto.MentorMatchResponse;
import com.dangkhoa.khoahd19.be.model.dto.NoteRewriteRequest;
import com.dangkhoa.khoahd19.be.model.dto.NoteRewriteResponse;
import com.dangkhoa.khoahd19.be.model.dto.SessionAskRequest;
import com.dangkhoa.khoahd19.be.model.dto.SessionAskResponse;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.AiMenteeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Mentee-facing AI features: mentor matchmaker + post-session tutor. */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiMenteeService aiMenteeService;

    /** Recommends the best-fit mentors from the real pool for a mentee's free-text need. */
    @PostMapping("/mentor-match")
    public ApiResponse<MentorMatchResponse> mentorMatch(@Valid @RequestBody MentorMatchRequest request) {
        return ApiResponse.ok(aiMenteeService.matchMentors(request.query()));
    }

    /** General AI Chatbot for platform & learning assistance. */
    @PostMapping("/chat")
    public ApiResponse<SessionAskResponse> generalChat(@Valid @RequestBody MentorMatchRequest request) {
        return ApiResponse.ok(aiMenteeService.generalChat(request.query()));
    }

    /** Answers a mentee's follow-up question grounded in a specific session. */
    @PostMapping("/sessions/{bookingId}/ask")
    public ApiResponse<SessionAskResponse> askSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String bookingId,
            @Valid @RequestBody SessionAskRequest request
    ) {
        return ApiResponse.ok(aiMenteeService.askAboutSession(principal.getUser(), bookingId, request.question()));
    }

    /** Rewrites a participant's rough in-meeting notes into clean main points. */
    @PostMapping("/sessions/{bookingId}/rewrite-note")
    public ApiResponse<NoteRewriteResponse> rewriteNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String bookingId,
            @Valid @RequestBody NoteRewriteRequest request
    ) {
        return ApiResponse.ok(aiMenteeService.rewriteNote(principal.getUser(), bookingId, request.notes()));
    }
}
