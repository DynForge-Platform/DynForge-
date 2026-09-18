package com.dynforge.be.model.entity;

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
@Document("reviews")
public class Review {

    @Id
    private String id;

    /** One review per booking. */
    @Indexed(unique = true)
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId bookingId;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId menteeId;

    /** The mentor's userId (matches MentorProfile.userId). */
    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId mentorId;

    private String courseCode;

    /** 1..5 */
    private int rating;

    private String comment;

    private Instant createdAt;
}
