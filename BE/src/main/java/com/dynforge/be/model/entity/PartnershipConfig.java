package com.dynforge.be.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("partnership_configs")
public class PartnershipConfig {

    @Id
    @Builder.Default
    private String id = "default";

    private List<StatItem> stats;
    private List<AdPlanItem> plans;

    @Builder.Default
    private Instant updatedAt = Instant.now();
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatItem {
        private String icon;
        private String value;
        private String labelVi;
        private String labelEn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdPlanItem {
        private String id;
        private String name;
        private Long monthlyPrice;
        private Integer yearlyDiscountPercent;
        private String color;
        private String badgeVi;
        private String badgeEn;
        private String badgeColor;
        private String descriptionVi;
        private String descriptionEn;
        private List<String> featuresVi;
        private List<String> featuresEn;
        private boolean highlight;
        @Builder.Default
        private boolean active = true;
    }
}
