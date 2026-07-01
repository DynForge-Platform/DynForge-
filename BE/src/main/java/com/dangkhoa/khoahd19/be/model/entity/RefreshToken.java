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
@Document("refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private ObjectId userId;

    @Indexed(unique = true)
    private String token;

    private Instant expiresAt;

    private Instant createdAt;
}
