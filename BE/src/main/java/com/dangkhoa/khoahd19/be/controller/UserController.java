package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.mapper.UserMapper;
import com.dangkhoa.khoahd19.be.model.dto.UserResponse;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return userMapper.toResponse(principal.getUser());
    }
}
