package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.dto.TopUpRequest;
import com.dangkhoa.khoahd19.be.model.dto.TopUpResponse;
import com.dangkhoa.khoahd19.be.model.dto.TransactionResponse;
import com.dangkhoa.khoahd19.be.model.dto.WalletResponse;
import com.dangkhoa.khoahd19.be.model.dto.WebhookRequest;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @Value("${app.webhook.secret}")
    private String webhookSecret;

    @GetMapping
    public ApiResponse<WalletResponse> getWallet(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(walletService.getWallet(principal.getUser()));
    }

    @PostMapping("/topup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TopUpResponse> topUp(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TopUpRequest request
    ) {
        return ApiResponse.ok("Top-up initiated", walletService.topUp(principal.getUser(), request));
    }

    @PostMapping("/webhook")
    public ApiResponse<TransactionResponse> webhook(
            @RequestHeader("X-Webhook-Secret") String secret,
            @Valid @RequestBody WebhookRequest body
    ) {
        if (!webhookSecret.equals(secret)) {
            throw new BadRequestException("Invalid webhook secret");
        }
        return ApiResponse.ok(walletService.handleWebhook(body));
    }
}
