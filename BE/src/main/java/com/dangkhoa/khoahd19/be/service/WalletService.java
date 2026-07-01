package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.model.dto.TopUpRequest;
import com.dangkhoa.khoahd19.be.model.dto.TopUpResponse;
import com.dangkhoa.khoahd19.be.model.dto.TransactionResponse;
import com.dangkhoa.khoahd19.be.model.dto.WalletResponse;
import com.dangkhoa.khoahd19.be.model.dto.WebhookRequest;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.entity.WalletTransaction;
import com.dangkhoa.khoahd19.be.model.enums.TransactionStatus;
import com.dangkhoa.khoahd19.be.model.enums.TransactionType;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import com.dangkhoa.khoahd19.be.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletTransactionRepository txnRepository;
    private final UserRepository userRepository;

    @Value("${app.payment.base-url:http://localhost:8080}")
    private String paymentBaseUrl;

    public WalletResponse getWallet(User user) {
        ObjectId userId = new ObjectId(user.getId());
        List<TransactionResponse> history = txnRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();

        return new WalletResponse(user.getWalletBalance(), history);
    }

    public TopUpResponse topUp(User user, TopUpRequest request) {
        String externalRef = UUID.randomUUID().toString();

        WalletTransaction txn = WalletTransaction.builder()
                .userId(new ObjectId(user.getId()))
                .type(TransactionType.TOPUP)
                .status(TransactionStatus.PENDING)
                .amount(request.amount())
                .description("Wallet top-up")
                .externalRef(externalRef)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        txnRepository.save(txn);

        String paymentUrl = paymentBaseUrl + "/api/wallet/webhook/simulate?txnRef=" + externalRef;
        return new TopUpResponse(txn.getId(), request.amount(), paymentUrl);
    }

    /**
     * Idempotent: if the webhook is replayed, returns the already-processed result
     * without crediting the wallet a second time.
     */
    public TransactionResponse handleWebhook(WebhookRequest body) {
        WalletTransaction txn = txnRepository.findByExternalRef(body.txnRef())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Unknown transaction reference: " + body.txnRef()));

        // Idempotency: already finalized — return current state
        if (txn.getStatus() != TransactionStatus.PENDING) {
            return toResponse(txn);
        }

        boolean success = body.status() == WebhookRequest.WebhookStatus.SUCCESS;
        txn.setStatus(success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED);
        txn.setUpdatedAt(Instant.now());
        txnRepository.save(txn);

        if (success) {
            creditWallet(txn.getUserId(), txn.getAmount());
        }

        return toResponse(txn);
    }

    private void creditWallet(ObjectId userId, long amount) {
        User user = userRepository.findById(userId.toHexString())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setWalletBalance(user.getWalletBalance() + amount);
        userRepository.save(user);
    }

    private TransactionResponse toResponse(WalletTransaction txn) {
        return new TransactionResponse(
                txn.getId(),
                txn.getType(),
                txn.getStatus(),
                txn.getAmount(),
                txn.getDescription(),
                txn.getRelatedBookingId(),
                txn.getCreatedAt()
        );
    }
}
