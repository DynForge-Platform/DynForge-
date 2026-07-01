package com.dangkhoa.khoahd19.be.model.dto;

import jakarta.validation.constraints.NotNull;

public record ResolveRequest(@NotNull Boolean releaseToMentor) {}
