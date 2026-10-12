package com.dynforge.be.repository;

import com.dynforge.be.model.entity.PartnershipLead;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnershipLeadRepository extends MongoRepository<PartnershipLead, String> {
    List<PartnershipLead> findAllByOrderByCreatedAtDesc();
    List<PartnershipLead> findByStatusOrderByCreatedAtDesc(String status);
}
