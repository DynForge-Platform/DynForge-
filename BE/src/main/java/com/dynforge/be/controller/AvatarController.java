package com.dynforge.be.controller;

import com.dynforge.be.model.dto.ApiResponse;
import com.dynforge.be.model.dto.UserResponse;
import com.dynforge.be.security.UserPrincipal;
import com.dynforge.be.service.AvatarService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class AvatarController {

    private final AvatarService avatarService;

    /** Upload a new profile photo for the signed-in user; returns the updated profile. */
    @PostMapping(value = "/api/users/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        return ApiResponse.ok("Avatar updated", avatarService.upload(principal.getUser(), file, request));
    }

    /** Public: profile photos are shown to everyone (mentor cards, chat…). Each id is immutable. */
    @GetMapping("/api/avatars/{id}")
    public ResponseEntity<Resource> get(@PathVariable String id) {
        AvatarService.LoadedAvatar avatar = avatarService.load(id);
        MediaType type;
        try {
            type = MediaType.parseMediaType(avatar.contentType() == null ? "image/jpeg" : avatar.contentType());
        } catch (Exception e) {
            type = MediaType.IMAGE_JPEG;
        }
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(avatar.resource());
    }
}
