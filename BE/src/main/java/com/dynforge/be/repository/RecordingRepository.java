package com.dynforge.be.repository;

import com.dynforge.be.model.entity.Recording;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RecordingRepository extends MongoRepository<Recording, String> {

    List<Recording> findAllByOrderByCreatedAtDesc();

    List<Recording> findByBookingIdOrderByCreatedAtDesc(ObjectId bookingId);
}
