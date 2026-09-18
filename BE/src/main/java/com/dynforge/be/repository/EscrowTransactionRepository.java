package com.dynforge.be.repository;

import com.dynforge.be.model.entity.EscrowTransaction;
import com.dynforge.be.model.enums.EscrowStatus;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface EscrowTransactionRepository extends MongoRepository<EscrowTransaction, String> {

    Optional<EscrowTransaction> findByBookingId(ObjectId bookingId);

    List<EscrowTransaction> findByMentorId(ObjectId mentorId);

    List<EscrowTransaction> findByStatus(EscrowStatus status);
}
