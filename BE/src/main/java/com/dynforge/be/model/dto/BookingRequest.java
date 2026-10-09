package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.BookingFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record BookingRequest(
        @NotBlank String mentorId,
        @NotBlank String courseCode,
        @NotNull BookingFormat format,
        @NotNull @Future(message = "Giờ học phải ở tương lai") Instant startAt,
        @Min(value = 15, message = "Thời lượng tối thiểu 15 phút") int durationMin
) {
}
