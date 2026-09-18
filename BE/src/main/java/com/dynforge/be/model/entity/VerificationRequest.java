package com.dynforge.be.model.entity;

import com.dynforge.be.model.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("verification_requests")
public class VerificationRequest {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId userId;

    private String course;

    /** "A" or "A+". */
    private String claimedGrade;

    private String transcriptUrl;

    @Builder.Default
    private VerificationStatus status = VerificationStatus.PENDING;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId reviewedBy;

    private Instant reviewedAt;

    private String note;

    private Instant createdAt;
}
