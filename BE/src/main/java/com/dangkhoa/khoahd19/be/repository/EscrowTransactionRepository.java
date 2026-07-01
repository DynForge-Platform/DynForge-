package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.EscrowTransaction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EscrowTransactionRepository extends MongoRepository<EscrowTransaction, String> {

    Optional<EscrowTransaction> findByBookingId(ObjectId bookingId);
}
