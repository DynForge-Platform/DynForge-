package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.model.dto.ForgotPasswordRequest;
import com.dangkhoa.khoahd19.be.model.dto.ResetPasswordRequest;
import com.dangkhoa.khoahd19.be.model.dto.VerifyOtpRequest;
import com.dangkhoa.khoahd19.be.model.entity.PasswordResetToken;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.repository.PasswordResetTokenRepository;
import com.dangkhoa.khoahd19.be.repository.RefreshTokenRepository;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.expiration-ms}")
    private long otpExpirationMs;

    /**
     * Generates and "sends" a one-time code. Always reports success so the endpoint
     * cannot be used to probe which emails are registered.
     */
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> user = userRepository.findByEmail(request.email());
        if (user.isEmpty()) {
            log.info("Password reset requested for unknown email {} — ignoring silently.", request.email());
            return;
        }

        String otp = String.format("%06d", random.nextInt(1_000_000));

        tokenRepository.deleteByEmail(request.email());
        tokenRepository.save(PasswordResetToken.builder()
                .email(request.email())
                .otp(otp)
                .verified(false)
                .expiresAt(Instant.now().plusMillis(otpExpirationMs))
                .createdAt(Instant.now())
                .build());

        mailService.sendOtpEmail(request.email(), otp, otpExpirationMs / 60_000);
    }

    public void verifyOtp(VerifyOtpRequest request) {
        PasswordResetToken token = requireValidOtp(request.email(), request.otp());
        token.setVerified(true);
        tokenRepository.save(token);
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = requireValidOtp(request.email(), request.otp());
        if (!token.isVerified()) {
            throw new BadRequestException("Please verify the OTP before resetting your password");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Account not found"));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        tokenRepository.deleteByEmail(request.email());
        refreshTokenRepository.deleteByUserId(new ObjectId(user.getId()));
    }

    private PasswordResetToken requireValidOtp(String email, String otp) {
        PasswordResetToken token = tokenRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.deleteByEmail(email);
            throw new BadRequestException("OTP has expired, please request a new one");
        }
        if (!token.getOtp().equals(otp)) {
            throw new BadRequestException("Invalid or expired OTP");
        }
        return token;
    }
}
