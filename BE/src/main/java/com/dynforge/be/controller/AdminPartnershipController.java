package com.dynforge.be.controller;

import com.dynforge.be.model.dto.ApiResponse;
import com.dynforge.be.model.dto.UpdateLeadStatusRequest;
import com.dynforge.be.model.entity.PartnershipConfig;
import com.dynforge.be.model.entity.PartnershipLead;
import com.dynforge.be.security.UserPrincipal;
import com.dynforge.be.service.PartnershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/partnerships")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPartnershipController {

    private final PartnershipService partnershipService;

    @GetMapping("/config")
    public ApiResponse<PartnershipConfig> getConfig() {
        return ApiResponse.ok(partnershipService.getConfig());
    }

    @PutMapping("/config")
    public ApiResponse<PartnershipConfig> updateConfig(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PartnershipConfig config
    ) {
        PartnershipConfig updated = partnershipService.updateConfig(principal != null ? principal.getUser() : null, config);
        return ApiResponse.ok("Đã cập nhật bảng giá và cấu hình quảng cáo thành công", updated);
    }

    @GetMapping("/leads")
    public ApiResponse<List<PartnershipLead>> listLeads(
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.ok(partnershipService.listLeads(status));
    }

    @PatchMapping("/leads/{id}/status")
    public ApiResponse<PartnershipLead> updateLeadStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateLeadStatusRequest body
    ) {
        PartnershipLead updated = partnershipService.updateLeadStatus(id, body.status(), body.adminNote());
        return ApiResponse.ok("Đã cập nhật trạng thái yêu cầu hợp tác", updated);
    }

    @DeleteMapping("/leads/{id}")
    public ApiResponse<Void> deleteLead(@PathVariable String id) {
        partnershipService.deleteLead(id);
        return ApiResponse.ok("Đã xóa yêu cầu hợp tác thành công", null);
    }
}
