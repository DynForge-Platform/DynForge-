package com.dangkhoa.khoahd19.be.seeder;

import com.dangkhoa.khoahd19.be.model.entity.Resource;
import com.dangkhoa.khoahd19.be.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class ResourceSeeder implements CommandLineRunner {

    private final ResourceRepository resourceRepository;

    @Override
    public void run(String... args) {
        if (resourceRepository.count() > 0) {
            return;
        }
        log.info("Seeding academic resources…");

        List<Resource> items = List.of(
            res("PDF Guide", "Mastering Dynamic Programming: A Practical Guide",
                "Step-by-step patterns and worked examples to solve DP problems with confidence.",
                "GRADORA Academy", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"),

            res("Article", "How to Structure Your Thesis in 6 Clear Stages",
                "A research advisor breaks down the thesis writing process from proposal to defense.",
                "Research Desk", "FPT University HCM", "Research", "Postgraduate",
                "https://www.scribbr.com/category/dissertation/"),

            res("Video", "Data Structures & Algorithms — Full Course",
                "A complete beginner-friendly walkthrough of core data structures and algorithms.",
                "freeCodeCamp", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.youtube.com/watch?v=8hly31xKli0"),

            res("Template", "CV Template for Tech Internships",
                "A clean, ATS-friendly CV template tailored for software engineering internships.",
                "GRADORA Careers", "FPT University HCM", "Career", "Undergraduate",
                "https://calibre-ebook.com/downloads/demos/demo.docx"),

            res("Article", "Understanding Machine Learning Fundamentals",
                "An accessible introduction to supervised learning, loss functions and evaluation.",
                "GRADORA Academy", "FPT University HCM", "AI/ML", "Graduate",
                "https://developers.google.com/machine-learning/crash-course"),

            res("Video", "Object-Oriented Programming in Java",
                "Learn encapsulation, inheritance and polymorphism with practical Java examples.",
                "Programming with Mosh", "FPT University HCM", "Computer Science", "Undergraduate",
                "https://www.youtube.com/watch?v=BSVKUk58K6U"),

            res("PDF Guide", "Financial Statements Explained",
                "A concise guide to reading balance sheets, income statements and cash flows.",
                "Business School", "FPT University HCM", "Business", "Graduate",
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"),

            res("Template", "Thesis Proposal Outline",
                "A ready-to-fill outline covering problem statement, methodology and timeline.",
                "Research Desk", "FPT University HCM", "Research", "Postgraduate",
                "https://calibre-ebook.com/downloads/demos/demo.docx")
        );

        resourceRepository.saveAll(items);
        log.info("Seeded {} resources.", items.size());
    }

    private static Resource res(String type, String title, String description, String source,
                                String university, String subject, String level, String url) {
        return Resource.builder()
                .type(type).title(title).description(description).source(source)
                .university(university).subject(subject).level(level).url(url)
                .createdAt(Instant.now())
                .build();
    }
}
