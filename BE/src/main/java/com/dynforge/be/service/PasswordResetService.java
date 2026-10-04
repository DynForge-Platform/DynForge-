package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.model.dto.ForgotPasswordRequest;
import com.dynforge.be.model.dto.ResetPasswordRequest;
import com.dynforge.be.model.dto.VerifyOtpRequest;
import com.dynforge.be.model.entity.PasswordResetToken;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.repository.PasswordResetTokenRepository;
import com.dynforge.be.repository.RefreshTokenRepository;
import com.dynforge.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
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

    @Value("${app.otp.secret:dynforge-otp-secret-key-32-chars-minimum}")
    private String otpSecret;

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

        String rawOtp = String.format("%06d", random.nextInt(1_000_000));
        String hashedOtp = hashOtp(rawOtp);

        tokenRepository.deleteByEmail(request.email());
        tokenRepository.save(PasswordResetToken.builder()
                .email(request.email())
                .otp(hashedOtp)
                .verified(false)
                .failedAttempts(0)
                .expiresAt(Instant.now().plusMillis(otpExpirationMs))
                .createdAt(Instant.now())
                .build());

        mailService.sendOtpEmail(request.email(), rawOtp, otpExpirationMs / 60_000);
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

    private PasswordResetToken requireValidOtp(String email, String inputOtp) {
        PasswordResetToken token = tokenRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn."));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.deleteByEmail(email);
            throw new BadRequestException("Mã OTP đã hết hạn, vui lòng yêu cầu mã mới.");
        }

        if (token.getFailedAttempts() >= 5) {
            tokenRepository.deleteByEmail(email);
            throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị hủy vì lý do an toàn. Vui lòng gửi lại yêu cầu mới.");
        }

        String hashedInput = hashOtp(inputOtp);
        boolean match = hashedInput.equals(token.getOtp()) || legacySha256(inputOtp).equals(token.getOtp()) || inputOtp.equals(token.getOtp());
        if (!match) {
            token.setFailedAttempts(token.getFailedAttempts() + 1);
            tokenRepository.save(token);
            int remaining = 5 - token.getFailedAttempts();
            if (remaining <= 0) {
                tokenRepository.deleteByEmail(email);
                throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị hủy vì lý do an toàn. Vui lòng gửi lại yêu cầu mới.");
            }
            throw new BadRequestException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        return token;
    }

    private String hashOtp(String rawOtp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(otpSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(rawOtp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HmacSHA256 not available", e);
        }
    }

    private String legacySha256(String rawOtp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawOtp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "";
        }
    }
}
