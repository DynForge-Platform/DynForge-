package com.dynforge.be.repository;

import com.dynforge.be.model.entity.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByEmail(String email);

    void deleteByEmail(String email);
}
