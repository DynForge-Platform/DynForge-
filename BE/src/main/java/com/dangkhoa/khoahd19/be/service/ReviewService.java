package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.mapper.ReviewMapper;
import com.dangkhoa.khoahd19.be.model.dto.ReviewRequest;
import com.dangkhoa.khoahd19.be.model.dto.ReviewResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.entity.MentorProfile;
import com.dangkhoa.khoahd19.be.model.entity.Review;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.repository.MentorRepository;
import com.dangkhoa.khoahd19.be.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final MentorRepository mentorRepository;
    private final ReviewMapper reviewMapper;

    public ReviewResponse create(User mentee, ReviewRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.bookingId()));

        if (!booking.getMenteeId().toHexString().equals(mentee.getId())) {
            throw new BadRequestException("Only the mentee of this booking can leave a review");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only review a completed session");
        }
        if (reviewRepository.existsByBookingId(new ObjectId(booking.getId()))) {
            throw new BadRequestException("This booking has already been reviewed");
        }

        Review review = reviewRepository.save(Review.builder()
                .bookingId(new ObjectId(booking.getId()))
                .menteeId(booking.getMenteeId())
                .mentorId(booking.getMentorId())
                .courseCode(booking.getCourseCode())
                .rating(request.rating())
                .comment(request.comment())
                .createdAt(Instant.now())
                .build());

        applyRating(booking.getMentorId(), request.rating());

        return reviewMapper.toResponse(review);
    }

    public List<ReviewResponse> listForMentor(String mentorUserId) {
        return reviewRepository.findByMentorIdOrderByCreatedAtDesc(new ObjectId(mentorUserId))
                .stream()
                .map(reviewMapper::toResponse)
                .toList();
    }

    /**
     * Incrementally folds the new rating into the mentor's running average, so seeded
     * baseline ratings are preserved rather than recomputed from scratch.
     */
    private void applyRating(ObjectId mentorUserId, int newRating) {
        MentorProfile profile = mentorRepository.findByUserId(mentorUserId).orElse(null);
        if (profile == null) return;

        int oldCount = profile.getRatingCount();
        double oldAvg = profile.getRatingAvg();

        int newCount = oldCount + 1;
        double newAvg = (oldAvg * oldCount + newRating) / newCount;

        profile.setRatingCount(newCount);
        profile.setRatingAvg(Math.round(newAvg * 100.0) / 100.0);
        mentorRepository.save(profile);
    }
}
