package com.dangkhoa.khoahd19.be.model.dto;

import com.dangkhoa.khoahd19.be.model.enums.BookingFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record BookingRequest(
        @NotBlank String mentorId,
        @NotBlank String courseCode,
        @NotNull BookingFormat format,
        @NotNull @Future Instant startAt,
        @Min(15) int durationMin
) {
}
