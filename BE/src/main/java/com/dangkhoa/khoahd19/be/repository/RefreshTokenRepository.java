package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.RefreshToken;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUserId(ObjectId userId);
}
