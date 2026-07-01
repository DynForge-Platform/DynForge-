package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.mapper.UserMapper;
import com.dangkhoa.khoahd19.be.model.dto.AuthResponse;
import com.dangkhoa.khoahd19.be.model.dto.LoginRequest;
import com.dangkhoa.khoahd19.be.model.dto.RegisterRequest;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.model.enums.UserStatus;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import com.dangkhoa.khoahd19.be.security.JwtService;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;

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

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, userMapper.toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, userMapper.toResponse(user));
    }
}
