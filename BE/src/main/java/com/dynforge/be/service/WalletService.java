package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.model.dto.TopUpRequest;
import com.dynforge.be.model.dto.TopUpResponse;
import com.dynforge.be.model.dto.TransactionResponse;
import com.dynforge.be.model.dto.WalletResponse;
import com.dynforge.be.model.dto.WebhookRequest;
import com.dynforge.be.model.dto.WithdrawRequest;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.entity.WalletTransaction;
import com.dynforge.be.model.enums.TransactionStatus;
import com.dynforge.be.model.enums.TransactionType;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletTransactionRepository txnRepository;
    private final UserRepository userRepository;
    private final PayOsClient payOsClient;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

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
        // PayOS orderCode must be a unique positive number; millis works well and fits in a long.
        long orderCode = System.currentTimeMillis();

        WalletTransaction txn = WalletTransaction.builder()
                .userId(new ObjectId(user.getId()))
                .type(TransactionType.TOPUP)
                .status(TransactionStatus.PENDING)
                .amount(request.amount())
                .description("Wallet top-up")
                .externalRef(String.valueOf(orderCode))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        txnRepository.save(txn);

        // PayOS redirects the buyer back to the wallet page (it appends orderCode + status).
        String returnUrl = frontendBaseUrl + "/dashboard/wallet";
        String cancelUrl = frontendBaseUrl + "/dashboard/wallet";
        String checkoutUrl = payOsClient.createPaymentLink(
                orderCode, request.amount(), "Nap vi DynForge", returnUrl, cancelUrl);

        return new TopUpResponse(txn.getId(), request.amount(), checkoutUrl);
    }

    /**
     * Called after PayOS redirects back. Verifies the payment with PayOS and credits
     * the wallet once (idempotent).
     */
    public TransactionResponse confirmPayosPayment(User user, long orderCode) {
        WalletTransaction txn = txnRepository.findByExternalRef(String.valueOf(orderCode))
                .orElseThrow(() -> new ResourceNotFoundException("Unknown order: " + orderCode));

        if (!txn.getUserId().toHexString().equals(user.getId())) {
            throw new BadRequestException("This payment does not belong to you");
        }

        // Idempotency: already finalized — return current state
        if (txn.getStatus() != TransactionStatus.PENDING) {
            return toResponse(txn);
        }

        String status = payOsClient.getPaymentStatus(orderCode);
        if ("PAID".equals(status)) {
            txn.setStatus(TransactionStatus.COMPLETED);
            txn.setUpdatedAt(Instant.now());
            txnRepository.save(txn);
            creditWallet(txn.getUserId(), txn.getAmount());
        } else if ("CANCELLED".equals(status) || "EXPIRED".equals(status)) {
            txn.setStatus(TransactionStatus.FAILED);
            txn.setUpdatedAt(Instant.now());
            txnRepository.save(txn);
        }
        // PENDING/PROCESSING → leave as-is; the buyer can retry confirmation.
        return toResponse(txn);
    }

    /**
     * Mentor payout: debits the wallet immediately and records a completed WITHDRAWAL.
     * (Demo: no real bank transfer — settlement is assumed instant.)
     */
    public TransactionResponse withdraw(User user, WithdrawRequest request) {
        if (user.getWalletBalance() < request.amount()) {
            throw new BadRequestException(
                    "Insufficient balance. Requested: " + request.amount()
                            + ", available: " + user.getWalletBalance());
        }

        user.setWalletBalance(user.getWalletBalance() - request.amount());
        userRepository.save(user);

        WalletTransaction txn = WalletTransaction.builder()
                .userId(new ObjectId(user.getId()))
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.COMPLETED)
                .amount(request.amount())
                .description("Withdrawal to " + request.bankName() + " · " + request.bankAccount())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return toResponse(txnRepository.save(txn));
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
