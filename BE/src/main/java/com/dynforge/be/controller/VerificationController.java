package com.dynforge.be.controller;

import com.dynforge.be.model.dto.ApiResponse;
import com.dynforge.be.model.dto.VerificationDecisionRequest;
import com.dynforge.be.model.dto.VerificationRequestDto;
import com.dynforge.be.model.dto.VerificationResponse;
import com.dynforge.be.model.enums.VerificationStatus;
import com.dynforge.be.security.UserPrincipal;
import com.dynforge.be.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VerificationResponse> submit(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerificationRequestDto dto
    ) {
        return ApiResponse.ok("Verification request submitted", verificationService.submit(principal.getUser(), dto));
    }

    @GetMapping("/mine")
    public ApiResponse<List<VerificationResponse>> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(verificationService.getMine(principal.getUser()));
    }

    @GetMapping
    public ApiResponse<List<VerificationResponse>> list(@RequestParam(required = false) VerificationStatus status) {
        return ApiResponse.ok(verificationService.list(status));
    }

    @PostMapping("/{id}/decision")
    public ApiResponse<VerificationResponse> decide(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody VerificationDecisionRequest decision
    ) {
        return ApiResponse.ok("Decision recorded", verificationService.decide(principal.getUser(), id, decision));
    }
}
