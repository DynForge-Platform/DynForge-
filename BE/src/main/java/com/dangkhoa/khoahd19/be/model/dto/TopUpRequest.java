package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.Min;

public record TopUpRequest(
        @Min(value = 10000, message = "Minimum top-up amount is 10,000") long amount
) {
}
