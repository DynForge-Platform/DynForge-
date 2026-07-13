package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.dto.ConversationDetailResponse;
import com.dangkhoa.khoahd19.be.model.dto.ConversationResponse;
import com.dangkhoa.khoahd19.be.model.dto.MessageResponse;
import com.dangkhoa.khoahd19.be.model.dto.SendMessageRequest;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/conversations")
    public ApiResponse<List<ConversationResponse>> conversations(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(messageService.listConversations(principal.getUser()));
    }

    @GetMapping("/{otherUserId}")
    public ApiResponse<ConversationDetailResponse> conversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String otherUserId
    ) {
        return ApiResponse.ok(messageService.getConversation(principal.getUser(), otherUserId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MessageResponse> send(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return ApiResponse.ok(messageService.send(principal.getUser(), request));
    }
}
