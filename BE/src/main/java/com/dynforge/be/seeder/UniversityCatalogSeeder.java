package com.dynforge.be.seeder;

import com.dynforge.be.model.entity.University;
import com.dynforge.be.model.enums.UniversityStatus;
import com.dynforge.be.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Opens DynForge to students of every university (not only FPTU): makes sure a catalogue of
 * Vietnamese universities exists, all ACTIVE, plus "Trường khác" for anyone whose school is not
 * listed. Idempotent: existing schools are kept as they are, except a WAITLIST school is opened.
 *
 * <p>Email domains are used to recognise a school email automatically during mentor verification,
 * so each domain must belong to exactly one university (shared domains such as vnu.edu.vn are left
 * out on purpose).
 */
@Slf4j
@Component
@Profile("!test")
@Order(0)
@RequiredArgsConstructor
public class UniversityCatalogSeeder implements CommandLineRunner {

    public static final String OTHER_CODE = "OTHER";

    private record Entry(String code, String name, String shortName, List<String> domains) { }

    private static final List<Entry> CATALOG = List.of(
            // ── TP. Hồ Chí Minh ──
            new Entry("HCMUS", "Trường Đại học Khoa học Tự nhiên – ĐHQG TP.HCM", "HCMUS", List.of("hcmus.edu.vn", "student.hcmus.edu.vn")),
            new Entry("HCMUT", "Trường Đại học Bách khoa – ĐHQG TP.HCM", "HCMUT", List.of("hcmut.edu.vn")),
            new Entry("UIT", "Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM", "UIT", List.of("uit.edu.vn", "gm.uit.edu.vn")),
            new Entry("USSH-HCM", "Trường Đại học Khoa học Xã hội và Nhân văn – ĐHQG TP.HCM", "USSH", List.of("hcmussh.edu.vn")),
            new Entry("UEL", "Trường Đại học Kinh tế – Luật – ĐHQG TP.HCM", "UEL", List.of("uel.edu.vn", "st.uel.edu.vn")),
            new Entry("HCMIU", "Trường Đại học Quốc tế – ĐHQG TP.HCM", "IU", List.of("hcmiu.edu.vn", "student.hcmiu.edu.vn")),
            new Entry("UEH", "Trường Đại học Kinh tế TP.HCM", "UEH", List.of("ueh.edu.vn", "st.ueh.edu.vn")),
            new Entry("HCMUTE", "Trường Đại học Sư phạm Kỹ thuật TP.HCM", "HCMUTE", List.of("hcmute.edu.vn", "student.hcmute.edu.vn")),
            new Entry("UTH", "Trường Đại học Giao thông Vận tải TP. Hồ Chí Minh", "UTH", List.of("ut.edu.vn")),
            new Entry("TDTU", "Trường Đại học Tôn Đức Thắng", "TDTU", List.of("tdtu.edu.vn", "student.tdtu.edu.vn")),
            new Entry("IUH", "Trường Đại học Công nghiệp TP.HCM", "IUH", List.of("iuh.edu.vn", "student.iuh.edu.vn")),
            new Entry("HUFLIT", "Trường Đại học Ngoại ngữ – Tin học TP.HCM", "HUFLIT", List.of("huflit.edu.vn")),
            new Entry("VLU", "Trường Đại học Văn Lang", "VLU", List.of("vanlanguni.vn", "vlu.edu.vn")),
            new Entry("HUTECH", "Trường Đại học Công nghệ TP.HCM", "HUTECH", List.of("hutech.edu.vn")),
            new Entry("HCMUE", "Trường Đại học Sư phạm TP.HCM", "HCMUE", List.of("hcmue.edu.vn", "student.hcmue.edu.vn")),
            new Entry("UFM", "Trường Đại học Tài chính – Marketing", "UFM", List.of("ufm.edu.vn")),
            new Entry("HUB", "Trường Đại học Ngân hàng TP.HCM", "HUB", List.of("hub.edu.vn")),
            new Entry("NLU", "Trường Đại học Nông Lâm TP.HCM", "NLU", List.of("hcmuaf.edu.vn", "st.hcmuaf.edu.vn")),
            new Entry("OU", "Trường Đại học Mở TP.HCM", "OU", List.of("ou.edu.vn")),
            new Entry("SGU", "Trường Đại học Sài Gòn", "SGU", List.of("sgu.edu.vn")),
            new Entry("UMP", "Đại học Y Dược TP.HCM", "UMP", List.of("ump.edu.vn")),
            new Entry("RMIT-VN", "Đại học RMIT Việt Nam", "RMIT", List.of("rmit.edu.vn")),
            new Entry("FPTU-HN", "Trường Đại học FPT – Hà Nội", "FPTU HN", List.of()),
            new Entry("FPTU-DN", "Trường Đại học FPT – Đà Nẵng", "FPTU ĐN", List.of()),
            new Entry("FPTU-CT", "Trường Đại học FPT – Cần Thơ", "FPTU CT", List.of()),
            new Entry("FPTU-QN", "Trường Đại học FPT – Quy Nhơn", "FPTU QN", List.of()),
            // ── Hà Nội ──
            new Entry("HUST", "Đại học Bách khoa Hà Nội", "HUST", List.of("hust.edu.vn", "sis.hust.edu.vn")),
            new Entry("VNU-UET", "Trường Đại học Công nghệ – ĐHQG Hà Nội", "UET", List.of()),
            new Entry("NEU", "Trường Đại học Kinh tế Quốc dân", "NEU", List.of("neu.edu.vn", "st.neu.edu.vn")),
            new Entry("FTU", "Trường Đại học Ngoại thương", "FTU", List.of("ftu.edu.vn")),
            new Entry("PTIT", "Học viện Công nghệ Bưu chính Viễn thông", "PTIT", List.of("ptit.edu.vn", "stu.ptit.edu.vn")),
            new Entry("HANU", "Trường Đại học Hà Nội", "HANU", List.of("hanu.edu.vn")),
            new Entry("UTC", "Trường Đại học Giao thông Vận tải", "UTC", List.of("utc.edu.vn")),
            new Entry("TMU", "Trường Đại học Thương mại", "TMU", List.of("tmu.edu.vn")),
            // ── Miền Trung & Tây Nam Bộ ──
            new Entry("DUT", "Trường Đại học Bách khoa – Đại học Đà Nẵng", "DUT", List.of("dut.udn.vn")),
            new Entry("DTU", "Trường Đại học Duy Tân", "DTU", List.of("duytan.edu.vn", "dtu.edu.vn")),
            new Entry("HUE", "Đại học Huế", "HUE", List.of("hueuni.edu.vn")),
            new Entry("CTU", "Trường Đại học Cần Thơ", "CTU", List.of("ctu.edu.vn", "student.ctu.edu.vn")),
            // ── Không có trong danh sách ──
            new Entry(OTHER_CODE, "Trường khác", "Trường khác", List.of())
    );

    private final UniversityRepository universityRepository;

    @Override
    public void run(String... args) {
        int created = 0;
        int opened = 0;
        for (Entry e : CATALOG) {
            University existing = universityRepository.findByCode(e.code()).orElse(null);
            if (existing == null) {
                universityRepository.save(University.builder()
                        .code(e.code())
                        .name(e.name())
                        .shortName(e.shortName())
                        .aliases(List.of(e.shortName()))
                        .emailDomains(e.domains())
                        .status(UniversityStatus.ACTIVE)
                        .createdAt(Instant.now())
                        .build());
                created++;
            } else if (existing.getStatus() == UniversityStatus.WAITLIST) {
                existing.setStatus(UniversityStatus.ACTIVE);
                universityRepository.save(existing);
                opened++;
            }
        }
        log.info("[UniversityCatalog] {} university(ies) created, {} opened from waitlist", created, opened);
    }
}
