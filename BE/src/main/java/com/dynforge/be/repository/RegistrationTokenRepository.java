package com.dynforge.be.repository;

import com.dynforge.be.model.entity.RegistrationToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegistrationTokenRepository extends MongoRepository<RegistrationToken, String> {

    Optional<RegistrationToken> findByEmail(String email);

    void deleteByEmail(String email);
}
