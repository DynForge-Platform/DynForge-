package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.dto.RecordingResponse;
import com.dangkhoa.khoahd19.be.security.UserPrincipal;
import com.dangkhoa.khoahd19.be.service.RecordingService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RecordingResponse> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String bookingId,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.ok("Recording uploaded", recordingService.save(principal.getUser(), bookingId, file));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        RecordingService.LoadedFile loaded = recordingService.loadFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(loaded.recording().getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"session-" + loaded.recording().getId() + ".webm\"")
                .body(loaded.resource());
    }
}
