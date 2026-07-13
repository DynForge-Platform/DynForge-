package com.dangkhoa.khoahd19.be.model.entity;

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
@Document("recordings")
public class Recording {

    @Id
    private String id;

    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId bookingId;

    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId uploaderId;

    private String uploaderName;

    private String courseCode;

    /** File name stored on disk. */
    private String filename;

    private String contentType;

    private long size;

    private Instant createdAt;
}
