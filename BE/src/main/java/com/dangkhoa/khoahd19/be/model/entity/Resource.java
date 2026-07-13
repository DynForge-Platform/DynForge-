package com.dangkhoa.khoahd19.be.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("resources")
public class Resource {

    @Id
    private String id;

    /** Article | PDF Guide | Video | Template */
    private String type;

    private String title;

    private String description;

    private String source;

    private String university;

    private String subject;

    private String level;

    /** External link opened by Read / Watch / Download. */
    private String url;

    private Instant createdAt;
}
