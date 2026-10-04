package com.dynforge.be.model.entity;

import com.dynforge.be.model.enums.BookingFormat;
import com.dynforge.be.model.enums.BookingStatus;
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

    /** Mentor counter-argument and evidence in response to a dispute. */
    private String disputeMentorResponse;

    private String disputeMentorEvidenceUrl;

    private Instant disputeRespondedAt;

    /** If rescheduled, records the previous startAt timestamp. */
    private Instant rescheduledFrom;

    /** Pending rescheduled start time awaiting mentor approval (for 12h-24h window). */
    private Instant pendingStartAt;

    /** Number of times this booking has been rescheduled (max 2). */
    @Builder.Default
    private int rescheduleCount = 0;

    /** Flag indicating 2h post-session mark-taught reminder email has been sent. */
    @Builder.Default
    private boolean reminder2hSent = false;

    /** Flag indicating 12h post-session mark-taught warning email has been sent. */
    @Builder.Default
    private boolean reminder12hSent = false;

    /** Random room ID (UUID) for Jitsi video classroom; avoids guessing meeting rooms. */
    private String roomId;

    /**
     * Returns the random roomId if present, or falls back to "DynForge-{id}" for legacy bookings.
     */
    public String getEffectiveRoomId() {
        return (roomId != null && !roomId.isBlank()) ? roomId : ("DynForge-" + id);
    }
}

