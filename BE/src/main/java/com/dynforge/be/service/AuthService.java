package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.mapper.UserMapper;
import com.dynforge.be.model.dto.AuthResponse;
import com.dynforge.be.model.dto.GoogleLoginRequest;
import com.dynforge.be.model.dto.LoginRequest;
import com.dynforge.be.model.dto.RefreshRequest;
import com.dynforge.be.model.dto.RegisterRequest;
import com.dynforge.be.model.entity.RefreshToken;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.model.enums.UserStatus;
import com.dynforge.be.repository.RefreshTokenRepository;
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

import java.time.Instant;
import java.util.EnumSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .phone(request.phone())
                .passwordHash(passwordEncoder.encode(request.password()))
                .roles(request.asMentor() ? EnumSet.of(Role.MENTEE, Role.MENTOR) : EnumSet.of(Role.MENTEE))
                .walletBalance(0)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
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
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
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
        refreshTokenRepository.findByToken(request.refreshToken())
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateToken(new UserPrincipal(user));
        String refreshTokenValue = issueRefreshToken(user);
        return new AuthResponse(accessToken, refreshTokenValue, userMapper.toResponse(user));
    }

    private String issueRefreshToken(User user) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(new ObjectId(user.getId()))
                .token(token)
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }
}
