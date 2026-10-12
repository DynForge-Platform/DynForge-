package com.dynforge.be.repository;

import com.dynforge.be.model.entity.PartnershipConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnershipConfigRepository extends MongoRepository<PartnershipConfig, String> {
}
