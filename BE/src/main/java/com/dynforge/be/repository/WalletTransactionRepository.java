package com.dynforge.be.repository;

import com.dynforge.be.model.entity.WalletTransaction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends MongoRepository<WalletTransaction, String> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(ObjectId userId);

    List<WalletTransaction> findAllByOrderByCreatedAtDesc();

    Optional<WalletTransaction> findByExternalRef(String externalRef);
}
