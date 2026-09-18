package com.dynforge.be.model.entity;

import com.dynforge.be.model.enums.TransactionStatus;
import com.dynforge.be.model.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("wallet_transactions")
public class WalletTransaction {

    @Id
    private String id;

    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId userId;

    private TransactionType type;

    private TransactionStatus status;

    /** Always a positive number; direction is determined by type (TOPUP/REFUND = credit, PAYMENT/COMMISSION = debit). */
    private long amount;

    private String description;

    /** Unique ref from the external payment provider — used for idempotency on webhook replays. */
    @Indexed(unique = true, sparse = true)
    private String externalRef;

    /** Booking linked to this transaction, if applicable. */
    private String relatedBookingId;

    private Instant createdAt;

    private Instant updatedAt;
}
