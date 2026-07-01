package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.WalletTransaction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends MongoRepository<WalletTransaction, String> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(ObjectId userId);

    Optional<WalletTransaction> findByExternalRef(String externalRef);
}
