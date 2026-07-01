package com.dangkhoa.khoahd19.be.mapper;

import com.dangkhoa.khoahd19.be.model.dto.VerificationResponse;
import com.dangkhoa.khoahd19.be.model.entity.VerificationRequest;
import org.springframework.stereotype.Component;

@Component
public class VerificationMapper {

    public VerificationResponse toResponse(VerificationRequest request) {
        return new VerificationResponse(
                request.getId(),
                request.getUserId().toHexString(),
                request.getCourse(),
                request.getClaimedGrade(),
                request.getTranscriptUrl(),
                request.getStatus(),
                request.getReviewedBy() != null ? request.getReviewedBy().toHexString() : null,
                request.getReviewedAt(),
                request.getNote(),
                request.getCreatedAt()
        );
    }
}
