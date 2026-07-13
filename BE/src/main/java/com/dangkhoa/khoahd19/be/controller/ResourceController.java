package com.dangkhoa.khoahd19.be.controller;

import com.dangkhoa.khoahd19.be.model.dto.ApiResponse;
import com.dangkhoa.khoahd19.be.model.entity.Resource;
import com.dangkhoa.khoahd19.be.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;

    @GetMapping
    public ApiResponse<List<Resource>> list() {
        return ApiResponse.ok(resourceRepository.findAll());
    }
}
