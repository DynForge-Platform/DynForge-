package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.Review;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {

    boolean existsByBookingId(ObjectId bookingId);

    List<Review> findByMentorIdOrderByCreatedAtDesc(ObjectId mentorId);
}
