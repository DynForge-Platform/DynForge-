package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record WithdrawRequest(
        @Min(value = 50000, message = "Minimum withdrawal amount is 50,000") long amount,
        @NotBlank String bankName,
        @NotBlank String bankAccount
) {
}
