package com.dynforge.be.seeder;

import com.dynforge.be.model.entity.Resource;
import com.dynforge.be.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@org.springframework.context.annotation.Profile("!test")
@Order(2)
@RequiredArgsConstructor
public class ResourceSeeder implements CommandLineRunner {

    private final ResourceRepository resourceRepository;

    @Override
    public void run(String... args) {
        List<Resource> items = defaults();

        if (resourceRepository.count() > 0) {
            backfillVietnamese(items);
            return;
        }
        log.info("Seeding academic resources…");
        resourceRepository.saveAll(items);
        log.info("Seeded {} resources.", items.size());
    }

    /** Adds Vietnamese title/description/source to resources seeded before these fields existed. */
    private void backfillVietnamese(List<Resource> defaults) {
        Map<String, Resource> byTitle = new HashMap<>();
        defaults.forEach(d -> byTitle.put(d.getTitle(), d));

        List<Resource> changed = new ArrayList<>();
        for (Resource existing : resourceRepository.findAll()) {
            Resource d = byTitle.get(existing.getTitle());
            if (d == null) continue;
            boolean dirty = false;
            if (existing.getTitleVi() == null) { existing.setTitleVi(d.getTitleVi()); dirty = true; }
            if (existing.getDescriptionVi() == null) { existing.setDescriptionVi(d.getDescriptionVi()); dirty = true; }
            if (existing.getSourceVi() == null) { existing.setSourceVi(d.getSourceVi()); dirty = true; }
            if (dirty) changed.add(existing);
        }
        if (!changed.isEmpty()) {
            resourceRepository.saveAll(changed);
            log.info("Backfilled Vietnamese text for {} resources.", changed.size());
        }
    }

    private static List<Resource> defaults() {
        return List.of(
            res("PDF Guide", "Mastering Dynamic Programming: A Practical Guide",
                "Step-by-step patterns and worked examples to solve DP problems with confidence.",
                "DynForge Academy", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "Làm chủ Quy hoạch động: Hướng dẫn thực hành",
                "Các dạng bài và ví dụ giải chi tiết từng bước để bạn tự tin giải bài toán quy hoạch động.",
                "Học viện DynForge"),

            res("Article", "How to Structure Your Thesis in 6 Clear Stages",
                "A research advisor breaks down the thesis writing process from proposal to defense.",
                "Research Desk", "FPT University HCM", "Research", "Postgraduate",
                "https://www.scribbr.com/category/dissertation/",
                "Xây dựng khóa luận qua 6 giai đoạn rõ ràng",
                "Cố vấn nghiên cứu hướng dẫn toàn bộ quy trình viết khóa luận, từ đề cương đến bảo vệ.",
                "Ban Nghiên cứu"),

            res("Video", "Data Structures & Algorithms — Full Course",
                "A complete beginner-friendly walkthrough of core data structures and algorithms.",
                "freeCodeCamp", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.youtube.com/watch?v=8hly31xKli0",
                "Cấu trúc dữ liệu & Giải thuật — Khóa học đầy đủ",
                "Khóa học trọn vẹn, dễ hiểu cho người mới về các cấu trúc dữ liệu và giải thuật cốt lõi.",
                "freeCodeCamp"),

            res("Template", "CV Template for Tech Internships",
                "A clean, ATS-friendly CV template tailored for software engineering internships.",
                "DynForge Careers", "FPT University HCM", "Career", "Undergraduate",
                "https://calibre-ebook.com/downloads/demos/demo.docx",
                "Mẫu CV xin thực tập ngành công nghệ",
                "Mẫu CV gọn gàng, dễ qua hệ thống lọc hồ sơ (ATS), dành cho vị trí thực tập kỹ sư phần mềm.",
                "DynForge Hướng nghiệp"),

            res("Article", "Understanding Machine Learning Fundamentals",
                "An accessible introduction to supervised learning, loss functions and evaluation.",
                "DynForge Academy", "FPT University HCM", "AI/ML", "Graduate",
                "https://developers.google.com/machine-learning/crash-course",
                "Nền tảng Học máy cho người mới",
                "Giới thiệu dễ hiểu về học có giám sát, hàm mất mát và cách đánh giá mô hình.",
                "Học viện DynForge"),

            res("Video", "Object-Oriented Programming in Java",
                "Learn encapsulation, inheritance and polymorphism with practical Java examples.",
                "Programming with Mosh", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.youtube.com/watch?v=BSVKUk58K6U",
                "Lập trình hướng đối tượng với Java",
                "Học tính đóng gói, kế thừa và đa hình qua các ví dụ Java thực tế.",
                "Programming with Mosh"),

            res("PDF Guide", "Financial Statements Explained",
                "A concise guide to reading balance sheets, income statements and cash flows.",
                "Business School", "FPT University HCM", "Business", "Graduate",
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "Hiểu nhanh báo cáo tài chính",
                "Hướng dẫn ngắn gọn cách đọc bảng cân đối kế toán, báo cáo kết quả kinh doanh và báo cáo lưu chuyển tiền tệ.",
                "Khoa Kinh doanh"),

            res("Template", "Thesis Proposal Outline",
                "A ready-to-fill outline covering problem statement, methodology and timeline.",
                "Research Desk", "FPT University HCM", "Research", "Postgraduate",
                "https://calibre-ebook.com/downloads/demos/demo.docx",
                "Dàn ý đề cương khóa luận",
                "Dàn ý điền sẵn gồm đặt vấn đề, phương pháp nghiên cứu và tiến độ thực hiện.",
                "Ban Nghiên cứu")
        );
    }

    private static Resource res(String type, String title, String description, String source,
                                String university, String subject, String level, String url,
                                String titleVi, String descriptionVi, String sourceVi) {
        return Resource.builder()
                .type(type).title(title).description(description).source(source)
                .university(university).subject(subject).level(level).url(url)
                .titleVi(titleVi).descriptionVi(descriptionVi).sourceVi(sourceVi)
                .createdAt(Instant.now())
                .build();
    }
}
