package com.dynforge.be.model.entity;

import com.dynforge.be.model.enums.EscrowStatus;
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
@Document("escrow_transactions")
public class EscrowTransaction {

    @Id
    private String id;

    @Indexed(unique = true)
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId bookingId;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId menteeId;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId mentorId;

    /** Full amount paid by the mentee. */
    private long totalAmount;

    private double commissionRate;

    /** = round(totalAmount * commissionRate) — kept by the platform. */
    private long commissionAmount;

    /** = totalAmount - commissionAmount — paid out to the mentor on release. */
    private long mentorPayout;

    @Builder.Default
    private EscrowStatus status = EscrowStatus.HELD;

    private Instant heldAt;

    private Instant releasedAt;
}
