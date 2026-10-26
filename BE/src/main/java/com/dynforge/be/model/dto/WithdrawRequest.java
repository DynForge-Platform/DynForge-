package com.dynforge.be.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record WithdrawRequest(
        @Min(value = 50000, message = "Số tiền rút tối thiểu là 50.000₫ (Minimum withdrawal amount is 50,000₫)")
        @Max(value = 50000000L, message = "Số tiền rút tối đa là 50.000.000₫ (Maximum withdrawal amount is 50,000,000₫)")
        long amount,
        @NotBlank String bankName,
        @NotBlank String bankAccount
) {
}
