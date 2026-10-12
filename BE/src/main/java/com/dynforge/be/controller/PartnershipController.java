package com.dynforge.be.controller;

import com.dynforge.be.model.dto.ApiResponse;
import com.dynforge.be.model.dto.PartnershipLeadRequest;
import com.dynforge.be.model.entity.PartnershipConfig;
import com.dynforge.be.model.entity.PartnershipLead;
import com.dynforge.be.service.PartnershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partnerships")
@RequiredArgsConstructor
public class PartnershipController {

    private final PartnershipService partnershipService;

    @GetMapping("/config")
    public ApiResponse<PartnershipConfig> getConfig() {
        return ApiResponse.ok(partnershipService.getConfig());
    }

    @PostMapping("/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PartnershipLead> submitLead(@Valid @RequestBody PartnershipLeadRequest req) {
        PartnershipLead lead = partnershipService.submitLead(req);
        return ApiResponse.ok("Yêu cầu hợp tác đã được tiếp nhận thành công", lead);
    }
}
