package com.dynforge.be.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("partnership_leads")
public class PartnershipLead {

    @Id
    private String id;

    private String companyName;
    private String contactName;
    private String email;
    private String phone;
    private String goals;

    private String planName;
    private String billingCycle;

    @Builder.Default
    private String status = "PENDING"; // PENDING, CONTACTED, CONVERTED, REJECTED

    private String adminNote;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();
}
