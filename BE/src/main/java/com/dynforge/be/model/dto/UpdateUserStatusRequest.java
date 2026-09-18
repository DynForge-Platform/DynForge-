package com.dynforge.be.model.dto;

import com.dynforge.be.model.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull UserStatus status
) {
}
