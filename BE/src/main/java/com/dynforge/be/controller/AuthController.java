package com.dynforge.be.controller;

import com.dynforge.be.model.dto.ApiResponse;
import com.dynforge.be.model.dto.AuthResponse;
import com.dynforge.be.model.dto.ForgotPasswordRequest;
import com.dynforge.be.model.dto.GoogleLoginRequest;
import com.dynforge.be.model.dto.LoginRequest;
import com.dynforge.be.model.dto.RefreshRequest;
import com.dynforge.be.model.dto.RegisterRequest;
import com.dynforge.be.model.dto.ResetPasswordRequest;
import com.dynforge.be.model.dto.VerifyOtpRequest;
import com.dynforge.be.service.AuthService;
import com.dynforge.be.service.GoogleTokenVerifier;
import com.dynforge.be.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final GoogleTokenVerifier googleTokenVerifier;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Account created successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    /** Sign in (or auto-register) with a Google ID token from Google Identity Services. */
    @PostMapping("/google")
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.ok(authService.loginWithGoogle(request));
    }

    /** Public OAuth client id so the frontend can render the Google button (empty = not configured). */
    @GetMapping("/google/config")
    public ApiResponse<Map<String, String>> googleConfig() {
        return ApiResponse.ok(Map.of("clientId",
                googleTokenVerifier.isConfigured() ? googleTokenVerifier.getClientId() : ""));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ApiResponse.ok("If the email is registered, an OTP has been sent", null);
    }

    @PostMapping("/verify-otp")
    public ApiResponse<Void> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        passwordResetService.verifyOtp(request);
        return ApiResponse.ok("OTP verified", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ApiResponse.ok("Password reset successfully", null);
    }
}
