package com.dynforge.be.service;

import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.mapper.MentorMapper;
import com.dynforge.be.model.dto.MentorProfileRequest;
import com.dynforge.be.model.dto.MentorProfileResponse;
import com.dynforge.be.model.entity.MentorProfile;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.model.enums.VerificationStatus;
import com.dynforge.be.repository.MentorRepository;
import com.dynforge.be.repository.UserRepository;
import com.dynforge.be.repository.VerificationRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final MentorRepository mentorRepository;
    private final UserRepository userRepository;
    private final VerificationRepository verificationRepository;
    private final MentorMapper mentorMapper;

    public List<MentorProfileResponse> listMentors(String courseCode, String format, Boolean verified) {
        boolean isVerified = verified == null || verified;

        List<MentorProfile> profiles = (courseCode == null || courseCode.isBlank())
                ? mentorRepository.findByVerified(isVerified)
                : mentorRepository.findByVerifiedAndCourses_Code(isVerified, courseCode);

        if (format != null && !format.isBlank()) {
            profiles = profiles.stream()
                    .filter(p -> p.getFormats() != null && p.getFormats().contains(format))
                    .toList();
        }

        return profiles.stream()
                .map(this::toResponse)
                .toList();
    }

    /** All mentor profiles (verified + unverified) — for admin management. */
    public List<MentorProfileResponse> listAllMentors() {
        return mentorRepository.findAll().stream().map(this::toResponse).toList();
    }

    public MentorProfileResponse getById(String id) {
        MentorProfile profile = mentorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor profile not found: " + id));
        return toResponse(profile);
    }

    public MentorProfileResponse getOwnProfile(User user) {
        MentorProfile profile = mentorRepository.findByUserId(new ObjectId(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("You have not created a mentor profile yet"));
        return toResponse(profile);
    }

    public MentorProfileResponse upsertOwnProfile(User user, MentorProfileRequest request) {
        ObjectId userId = new ObjectId(user.getId());
        // A new profile inherits verified=true if the mentor already has an approved verification.
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseGet(() -> MentorProfile.builder()
                        .userId(userId)
                        .verified(hasApprovedVerification(userId))
                        .build());

        profile.setTitle(request.title());
        profile.setBio(request.bio());
        profile.setMajor(request.major());
        profile.setUniversity(request.university());
        profile.setTeachingRole(request.teachingRole());
        profile.setCourses(request.courses());
        profile.setSkills(request.skills());
        profile.setLanguages(request.languages());
        if (request.formats() != null && !request.formats().isEmpty()) {
            profile.setFormats(request.formats());
        }
        profile.setAvailability(request.availability());

        profile = mentorRepository.save(profile);

        if (!user.getRoles().contains(Role.MENTOR)) {
            user.setRoles(EnumSet.copyOf(user.getRoles()));
            user.getRoles().add(Role.MENTOR);
            userRepository.save(user);
        }

        return mentorMapper.toResponse(profile, user);
    }

    private boolean hasApprovedVerification(ObjectId userId) {
        return verificationRepository.findByUserId(userId).stream()
                .anyMatch(v -> v.getStatus() == VerificationStatus.APPROVED);
    }

    private MentorProfileResponse toResponse(MentorProfile profile) {
        User user = userRepository.findById(profile.getUserId().toHexString())
                .orElseThrow(() -> new ResourceNotFoundException("Mentor user not found: " + profile.getUserId()));
        return mentorMapper.toResponse(profile, user);
    }
}
