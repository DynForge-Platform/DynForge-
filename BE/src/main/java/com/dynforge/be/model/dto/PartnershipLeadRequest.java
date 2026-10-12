package com.dynforge.be.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PartnershipLeadRequest(
        @NotBlank(message = "Tên công ty hoặc thương hiệu không được để trống")
        String companyName,

        @NotBlank(message = "Người liên hệ không được để trống")
        String contactName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        String phone,
        String goals,
        String planName,
        String billingCycle
) {
}
