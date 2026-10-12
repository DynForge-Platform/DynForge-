package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.model.dto.PartnershipLeadRequest;
import com.dynforge.be.model.entity.PartnershipConfig;
import com.dynforge.be.model.entity.PartnershipLead;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.repository.PartnershipConfigRepository;
import com.dynforge.be.repository.PartnershipLeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnershipService {

    private final PartnershipConfigRepository configRepository;
    private final PartnershipLeadRepository leadRepository;

    public PartnershipConfig getConfig() {
        return configRepository.findById("default").orElseGet(this::initDefaultConfig);
    }

    public PartnershipConfig updateConfig(User admin, PartnershipConfig newConfig) {
        if (newConfig == null) {
            throw new BadRequestException("Cấu hình không hợp lệ");
        }
        newConfig.setId("default");
        newConfig.setUpdatedAt(Instant.now());
        newConfig.setUpdatedBy(admin != null ? admin.getEmail() : "admin");
        return configRepository.save(newConfig);
    }

    public PartnershipLead submitLead(PartnershipLeadRequest req) {
        PartnershipLead lead = PartnershipLead.builder()
                .companyName(req.companyName())
                .contactName(req.contactName())
                .email(req.email())
                .phone(req.phone())
                .goals(req.goals())
                .planName(req.planName() != null ? req.planName() : "Growth")
                .billingCycle(req.billingCycle() != null ? req.billingCycle() : "monthly")
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        PartnershipLead saved = leadRepository.save(lead);
        log.info("New partnership lead received from company: {} ({}) for plan: {}",
                lead.getCompanyName(), lead.getEmail(), lead.getPlanName());
        return saved;
    }

    public List<PartnershipLead> listLeads(String status) {
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            return leadRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        }
        return leadRepository.findAllByOrderByCreatedAtDesc();
    }

    public PartnershipLead updateLeadStatus(String id, String status, String note) {
        PartnershipLead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu hợp tác: " + id));

        if (status != null && !status.isBlank()) {
            lead.setStatus(status.toUpperCase());
        }
        if (note != null) {
            lead.setAdminNote(note);
        }
        lead.setUpdatedAt(Instant.now());
        return leadRepository.save(lead);
    }

    public void deleteLead(String id) {
        if (!leadRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy yêu cầu hợp tác: " + id);
        }
        leadRepository.deleteById(id);
    }

    private PartnershipConfig initDefaultConfig() {
        PartnershipConfig def = PartnershipConfig.builder()
                .id("default")
                .stats(List.of(
                        new PartnershipConfig.StatItem("Users", "12,000+", "Sinh viên hoạt động hằng tháng", "Monthly active students"),
                        new PartnershipConfig.StatItem("BarChart3", "85%", "Tỷ lệ tương tác với quảng cáo", "Ad engagement rate"),
                        new PartnershipConfig.StatItem("Star", "4.9/5", "Mức hài lòng của đối tác", "Partner satisfaction"),
                        new PartnershipConfig.StatItem("Megaphone", "40+", "Trường đại học tiếp cận", "Universities reached")
                ))
                .plans(List.of(
                        PartnershipConfig.AdPlanItem.builder()
                                .id("starter")
                                .name("Starter")
                                .monthlyPrice(2500000L)
                                .yearlyDiscountPercent(17)
                                .color("border-slate-800")
                                .badgeVi(null)
                                .badgeEn(null)
                                .badgeColor("")
                                .descriptionVi("Phù hợp cho thương hiệu nhỏ và startup muốn tiếp cận thị trường sinh viên.")
                                .descriptionEn("Ideal for small brands and startups looking to reach university students.")
                                .featuresVi(List.of(
                                        "Banner quảng cáo trên trang Tìm Mentor",
                                        "Tối đa 10.000 lượt hiển thị / tháng",
                                        "Link trực tiếp đến landing page của bạn",
                                        "Báo cáo hiệu suất hàng tháng"
                                ))
                                .featuresEn(List.of(
                                        "Ad banner on Find Mentors page",
                                        "Up to 10,000 impressions / month",
                                        "Direct link to your landing page",
                                        "Monthly performance report"
                                ))
                                .highlight(false)
                                .active(true)
                                .build(),
                        PartnershipConfig.AdPlanItem.builder()
                                .id("growth")
                                .name("Growth")
                                .monthlyPrice(6000000L)
                                .yearlyDiscountPercent(17)
                                .color("border-cyan-500")
                                .badgeVi("Phổ biến nhất")
                                .badgeEn("Most Popular")
                                .badgeColor("bg-cyan-600")
                                .descriptionVi("Lý tưởng cho thương hiệu muốn tiếp cận sinh viên đại học theo quy mô lớn.")
                                .descriptionEn("Ideal for brands wanting to reach university students at scale.")
                                .featuresVi(List.of(
                                        "Banner + thẻ tài trợ in-feed nổi bật",
                                        "Tối đa 50.000 lượt hiển thị / tháng",
                                        "Vị trí nổi bật trên trang chủ",
                                        "Huy hiệu tài trợ trên hồ sơ Mentor",
                                        "Dashboard phân tích 2 tuần / lần",
                                        "Account manager riêng"
                                ))
                                .featuresEn(List.of(
                                        "Prominent banner + in-feed sponsored card",
                                        "Up to 50,000 impressions / month",
                                        "Featured placement on homepage",
                                        "Sponsor badge on Mentor profiles",
                                        "Analytics dashboard bi-weekly",
                                        "Dedicated account manager"
                                ))
                                .highlight(true)
                                .active(true)
                                .build(),
                        PartnershipConfig.AdPlanItem.builder()
                                .id("enterprise")
                                .name("Enterprise")
                                .monthlyPrice(null)
                                .yearlyDiscountPercent(17)
                                .color("border-slate-700")
                                .badgeVi("Doanh nghiệp lớn")
                                .badgeEn("Enterprise")
                                .badgeColor("bg-slate-800")
                                .descriptionVi("Tích hợp toàn nền tảng dành cho đối tác doanh nghiệp và trường đại học.")
                                .descriptionEn("Full-platform integration for enterprise partners and universities.")
                                .featuresVi(List.of(
                                        "Tất cả tính năng của gói Growth",
                                        "Tài nguyên & nội dung bài viết tài trợ",
                                        "Sự kiện mentor đồng thương hiệu",
                                        "Đặt quảng cáo trong email newsletter",
                                        "Chiến lược chiến dịch tùy chỉnh",
                                        "Hỗ trợ ưu tiên 24/7 & cam kết SLA"
                                ))
                                .featuresEn(List.of(
                                        "All features of Growth plan",
                                        "Sponsored resources & content",
                                        "Co-branded mentor workshops",
                                        "Student newsletter placement",
                                        "Custom marketing strategy",
                                        "Priority 24/7 support & SLA"
                                ))
                                .highlight(false)
                                .active(true)
                                .build()
                ))
                .updatedAt(Instant.now())
                .updatedBy("system")
                .build();

        return configRepository.save(def);
    }
}
