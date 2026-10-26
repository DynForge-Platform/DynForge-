package com.dynforge.be.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record TopUpRequest(
        @Min(value = 10000, message = "Số tiền nạp tối thiểu là 10.000₫ (Minimum top-up amount is 10,000₫)")
        @Max(value = 50000000L, message = "Số tiền nạp tối đa là 50.000.000₫ (Maximum top-up amount is 50,000,000₫)")
        long amount
) {
}
