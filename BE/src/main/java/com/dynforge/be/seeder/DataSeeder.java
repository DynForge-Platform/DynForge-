package com.dynforge.be.seeder;

import com.dynforge.be.model.entity.University;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.model.enums.UniversityStatus;
import com.dynforge.be.model.enums.UserStatus;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.UniversityRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@Profile("!test")
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final UniversityRepository universityRepository;
    private final VerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "DynForge@123";

    @Override
    public void run(String... args) {
        // ── Universities ─────────────────────────────────────────────────────
        University fptu = universityRepository.findByCode("FPTU-HCM")
                .orElseThrow(() -> new IllegalStateException("FPTU-HCM university missing — did UniversityMigration run?"));
        universityRepository.findByCode("UTH")
                .orElseGet(() -> {
                    log.info("Seeding demo university UTH…");
                    return universityRepository.save(University.builder()
                            .code("UTH")
                            .name("Trường Đại học Giao thông Vận tải TP. Hồ Chí Minh")
                            .shortName("UTH")
                            .aliases(List.of("UTH", "GTVT", "Giao thông Vận tải"))
                            .emailDomains(List.of("ut.edu.vn"))
                            .status(UniversityStatus.WAITLIST)
                            .createdAt(Instant.now())
                            .build());
                });

        // ── Ensure Admin account always exists ───────────────────────────────
        if (!userRepository.existsByEmail("admin@dynforge.vn")) {
            log.info("Creating default admin account admin@dynforge.vn…");
            createUser("Admin DynForge", "admin@dynforge.vn", Set.of(Role.ADMIN), null, null, 0, fptu);
        }

        // ── Clean up all demo accounts and demo mentor profiles ──────────────
        List<User> demoUsers = userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null
                        && u.getEmail().toLowerCase().endsWith("@dynforge.vn")
                        && !u.getEmail().equalsIgnoreCase("admin@dynforge.vn"))
                .toList();

        for (User u : demoUsers) {
            ObjectId uid = new ObjectId(u.getId());
            mentorRepository.findByUserId(uid).ifPresent(mentorRepository::delete);
            verificationRepository.findByUserId(uid).forEach(verificationRepository::delete);
            userRepository.delete(u);
            log.info("[DataSeeder] Cleaned up demo account: {}", u.getEmail());
        }

        // Cleanup any orphaned mentor profiles
        mentorRepository.findAll().forEach(mp -> {
            if (mp.getUserId() == null || userRepository.findById(mp.getUserId().toHexString()).isEmpty()) {
                mentorRepository.delete(mp);
                log.info("[DataSeeder] Cleaned up orphaned mentor profile: id={}", mp.getId());
            }
        });

        log.info("[DataSeeder] Mentor cleanup complete. Only real mentors and admin@dynforge.vn exist.");
    }

    private User createUser(String fullName, String email, Set<Role> roles,
                            String major, String year, long walletBalance, University university) {
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .roles(roles)
                .major(major)
                .universityId(new ObjectId(university.getId()))
                .year(year)
                .walletBalance(walletBalance)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        return userRepository.save(user);
    }
}
