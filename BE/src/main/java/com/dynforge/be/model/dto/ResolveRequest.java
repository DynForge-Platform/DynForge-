package com.dynforge.be.model.dto;

import jakarta.validation.constraints.NotNull;

public record ResolveRequest(@NotNull Boolean releaseToMentor) {}
