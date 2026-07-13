package com.dangkhoa.khoahd19.be.mapper;

import com.dangkhoa.khoahd19.be.model.dto.ReviewResponse;
import com.dangkhoa.khoahd19.be.model.entity.Review;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReviewMapper {

    private final UserRepository userRepository;

    public ReviewResponse toResponse(Review review) {
        User mentee = userRepository.findById(review.getMenteeId().toHexString()).orElse(null);
        return new ReviewResponse(
                review.getId(),
                review.getBookingId().toHexString(),
                review.getMenteeId().toHexString(),
                mentee != null ? mentee.getFullName() : null,
                mentee != null ? mentee.getAvatarUrl() : null,
                review.getMentorId().toHexString(),
                review.getCourseCode(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
