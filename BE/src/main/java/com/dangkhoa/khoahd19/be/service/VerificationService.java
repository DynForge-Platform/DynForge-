package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.mapper.VerificationMapper;
import com.dangkhoa.khoahd19.be.model.dto.VerificationDecisionRequest;
import com.dangkhoa.khoahd19.be.model.dto.VerificationRequestDto;
import com.dangkhoa.khoahd19.be.model.dto.VerificationResponse;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.entity.VerificationRequest;
import com.dangkhoa.khoahd19.be.model.enums.VerificationStatus;
import com.dangkhoa.khoahd19.be.repository.MentorRepository;
import com.dangkhoa.khoahd19.be.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationRepository verificationRepository;
    private final MentorRepository mentorRepository;
    private final VerificationMapper verificationMapper;

    public VerificationResponse submit(User user, VerificationRequestDto dto) {
        VerificationRequest request = VerificationRequest.builder()
                .userId(new ObjectId(user.getId()))
                .course(dto.course())
                .claimedGrade(dto.claimedGrade())
                .transcriptUrl(dto.transcriptUrl())
                .status(VerificationStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        return verificationMapper.toResponse(verificationRepository.save(request));
    }

    public List<VerificationResponse> list(VerificationStatus status) {
        List<VerificationRequest> requests = status == null
                ? verificationRepository.findAll()
                : verificationRepository.findByStatus(status);

        return requests.stream().map(verificationMapper::toResponse).toList();
    }

    public VerificationResponse decide(User reviewer, String id, VerificationDecisionRequest decision) {
        if (decision.status() == VerificationStatus.PENDING) {
            throw new BadRequestException("Decision must be APPROVED or REJECTED");
        }

        VerificationRequest request = verificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification request not found: " + id));

        request.setStatus(decision.status());
        request.setNote(decision.note());
        request.setReviewedBy(new ObjectId(reviewer.getId()));
        request.setReviewedAt(Instant.now());
        request = verificationRepository.save(request);

        if (decision.status() == VerificationStatus.APPROVED) {
            mentorRepository.findByUserId(request.getUserId()).ifPresent(profile -> {
                profile.setVerified(true);
                mentorRepository.save(profile);
            });
        }

        return verificationMapper.toResponse(request);
    }
}
