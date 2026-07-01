package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.VerificationDecisionRequest;
import com.dangkhoa.khoahd19.be.model.dto.VerificationRequestDto;
import com.dangkhoa.khoahd19.be.model.dto.VerificationResponse;
import com.dangkhoa.khoahd19.be.model.enums.VerificationStatus;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.VerificationService;
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
    public VerificationResponse submit(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerificationRequestDto dto
    ) {
        return verificationService.submit(principal.getUser(), dto);
    }

    @GetMapping
    public List<VerificationResponse> list(@RequestParam(required = false) VerificationStatus status) {
        return verificationService.list(status);
    }

    @PostMapping("/{id}/decision")
    public VerificationResponse decide(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody VerificationDecisionRequest decision
    ) {
        return verificationService.decide(principal.getUser(), id, decision);
    }
}
