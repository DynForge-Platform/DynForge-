package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.mapper.UserMapper;
import com.dynforge.be.model.dto.AuthResponse;
import com.dynforge.be.model.dto.GoogleLoginRequest;
import com.dynforge.be.model.dto.LoginRequest;
import com.dynforge.be.model.dto.RefreshRequest;
import com.dynforge.be.model.dto.RegisterRequest;
import com.dynforge.be.model.dto.ResendRegisterOtpRequest;
import com.dynforge.be.model.dto.VerifyRegisterOtpRequest;
import com.dynforge.be.model.entity.RefreshToken;
import com.dynforge.be.model.entity.RegistrationToken;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.model.enums.UserStatus;
import com.dynforge.be.repository.RefreshTokenRepository;
import com.dynforge.be.repository.RegistrationTokenRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.security.JwtService;
import com.dynforge.be.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
import java.util.EnumSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RegistrationTokenRepository registrationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final MailService mailService;

    private final SecureRandom random = new SecureRandom();

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.otp.expiration-ms:600000}")
    private long otpExpirationMs;

    @Value("${app.otp.secret:dynforge-otp-secret-key-32-chars-minimum}")
    private String otpSecret;

    /**
     * Bắt đầu quy trình đăng ký: Gửi mã OTP xác thực tới email để đảm bảo email có thật ngoài đời.
     */
    public void initiateRegister(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.");
        }

        String rawOtp = String.format("%06d", random.nextInt(1_000_000));
        String hashedOtp = hashOtp(rawOtp);

        registrationTokenRepository.deleteByEmail(email);
        registrationTokenRepository.save(RegistrationToken.builder()
                .email(email)
                .fullName(request.fullName().trim())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .roles(request.asMentor() ? EnumSet.of(Role.MENTEE, Role.MENTOR) : EnumSet.of(Role.MENTEE))
                .otp(hashedOtp)
                .failedAttempts(0)
                .expiresAt(Instant.now().plusMillis(otpExpirationMs))
                .createdAt(Instant.now())
                .build());

        mailService.sendRegistrationOtpEmail(email, rawOtp, otpExpirationMs / 60_000);
    }

    /**
     * Xác thực mã OTP và kích hoạt tài khoản chính thức.
     */
    public AuthResponse verifyRegisterOtp(VerifyRegisterOtpRequest request) {
        String email = request.email().trim().toLowerCase();
        RegistrationToken token = registrationTokenRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin đăng ký hoặc mã OTP đã hết hạn. Vui lòng đăng ký lại."));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            registrationTokenRepository.deleteByEmail(email);
            throw new BadRequestException("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
        }

        if (token.getFailedAttempts() >= 5) {
            registrationTokenRepository.deleteByEmail(email);
            throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Yêu cầu đăng ký đã bị hủy vì lý do bảo mật. Vui lòng thử lại.");
        }

        String hashedInput = hashOtp(request.otp().trim());
        boolean match = hashedInput.equals(token.getOtp()) || request.otp().trim().equals(token.getOtp());
        if (!match) {
            token.setFailedAttempts(token.getFailedAttempts() + 1);
            registrationTokenRepository.save(token);
            int remaining = 5 - token.getFailedAttempts();
            if (remaining <= 0) {
                registrationTokenRepository.deleteByEmail(email);
                throw new BadRequestException("Bạn đã nhập sai mã OTP quá 5 lần. Yêu cầu đăng ký đã bị hủy.");
            }
            throw new BadRequestException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        if (userRepository.existsByEmail(email)) {
            registrationTokenRepository.deleteByEmail(email);
            throw new BadRequestException("Tài khoản với email này đã tồn tại.");
        }

        User user = User.builder()
                .fullName(token.getFullName())
                .email(token.getEmail())
                .phone(token.getPhone())
                .passwordHash(token.getPasswordHash())
                .roles(token.getRoles() != null && !token.getRoles().isEmpty() ? token.getRoles() : EnumSet.of(Role.MENTEE))
                .walletBalance(0)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        user = userRepository.save(user);
        registrationTokenRepository.deleteByEmail(email);

        return buildAuthResponse(user);
    }

    /**
     * Gửi lại mã OTP đăng ký.
     */
    public void resendRegisterOtp(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        RegistrationToken token = registrationTokenRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông tin đăng ký cho email này. Vui lòng đăng ký lại."));

        String rawOtp = String.format("%06d", random.nextInt(1_000_000));
        String hashedOtp = hashOtp(rawOtp);

        token.setOtp(hashedOtp);
        token.setFailedAttempts(0);
        token.setExpiresAt(Instant.now().plusMillis(otpExpirationMs));
        registrationTokenRepository.save(token);

        mailService.sendRegistrationOtpEmail(email, rawOtp, otpExpirationMs / 60_000);
    }

    public AuthResponse register(RegisterRequest request) {
        initiateRegister(request);
        return null;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        return buildAuthResponse(user);
    }

    /**
     * Sign in with a verified Google ID token. First-time users get an account created on the
     * fly (MENTEE role, random password — they can set a real one via "forgot password").
     */
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenVerifier.GoogleUser google = googleTokenVerifier.verify(request.idToken());

        User user = userRepository.findByEmail(google.email()).orElseGet(() -> User.builder()
                .fullName(google.fullName())
                .email(google.email())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .roles(EnumSet.of(Role.MENTEE))
                .avatarUrl(google.avatarUrl())
                .walletBalance(0)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build());

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BadRequestException("This account has been suspended");
        }
        if (user.getId() == null) {
            user = userRepository.save(user);
        } else if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && google.avatarUrl() != null) {
            user.setAvatarUrl(google.avatarUrl());
            user = userRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String rawToken = request.refreshToken();
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException("Invalid refresh token");
        }

        String tokenHash = hashToken(rawToken);
        RefreshToken stored = refreshTokenRepository.findByToken(tokenHash)
                .or(() -> refreshTokenRepository.findByToken(rawToken))
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            throw new BadRequestException("Refresh token has expired, please log in again");
        }

        User user = userRepository.findById(stored.getUserId().toHexString())
                .orElseThrow(() -> new BadRequestException("User not found"));

        // Rotate: delete old token, issue new pair
        refreshTokenRepository.delete(stored);
        return buildAuthResponse(user);
    }

    public void logout(RefreshRequest request) {
        String rawToken = request.refreshToken();
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByToken(tokenHash)
                .ifPresentOrElse(
                        refreshTokenRepository::delete,
                        () -> refreshTokenRepository.findByToken(rawToken).ifPresent(refreshTokenRepository::delete)
                );
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateToken(new UserPrincipal(user));
        String refreshTokenValue = issueRefreshToken(user);
        return new AuthResponse(accessToken, refreshTokenValue, userMapper.toResponse(user));
    }

    private String issueRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(new ObjectId(user.getId()))
                .token(tokenHash)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    private String hashToken(String rawToken) {
        if (rawToken == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
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
}
