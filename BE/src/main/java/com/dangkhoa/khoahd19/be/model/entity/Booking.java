package com.dangkhoa.khoahd19.be.model.entity;

import com.dangkhoa.khoahd19.be.model.enums.BookingFormat;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;
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
@Document("bookings")
public class Booking {

    @Id
    private String id;

    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId menteeId;

    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId mentorId;

    private String courseCode;

    private BookingFormat format;

    private Instant startAt;

    private int durationMin;

    private long price;

    @Builder.Default
    private double commissionRate = 0.15;

    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId escrowTxnId;

    private Instant createdAt;

    /** Set when the mentor accepts the booking request. */
    private Instant acceptedAt;

    /** Set when the mentor marks the session as taught; used by the auto-confirm scheduler. */
    private Instant taughtAt;

    /** Category + description supplied by the mentee when opening a dispute. */
    private String disputeIssueType;

    private String disputeReason;
}
