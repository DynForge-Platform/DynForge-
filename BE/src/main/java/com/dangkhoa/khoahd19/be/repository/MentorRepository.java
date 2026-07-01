package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.MentorProfile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MentorRepository extends MongoRepository<MentorProfile, String> {

    Optional<MentorProfile> findByUserId(ObjectId userId);

    List<MentorProfile> findByVerifiedTrue();

    List<MentorProfile> findByVerifiedTrueAndCourses_Code(String courseCode);
}
