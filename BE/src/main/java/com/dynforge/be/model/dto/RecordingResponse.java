package com.dynforge.be.model.dto;

import java.time.Instant;

public record RecordingResponse(
        String id,
        String bookingId,
        String courseCode,
        String uploaderName,
        String contentType,
        long size,
        Instant createdAt
) {
}
