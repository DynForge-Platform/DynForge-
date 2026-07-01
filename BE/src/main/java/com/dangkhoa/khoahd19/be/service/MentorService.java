package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.mapper.MentorMapper;
import com.dangkhoa.khoahd19.be.model.dto.MentorProfileRequest;
import com.dangkhoa.khoahd19.be.model.dto.MentorProfileResponse;
import com.dangkhoa.khoahd19.be.model.entity.MentorProfile;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.repository.MentorRepository;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
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
    private final MentorMapper mentorMapper;

    public List<MentorProfileResponse> listMentors(String courseCode) {
        List<MentorProfile> profiles = (courseCode == null || courseCode.isBlank())
                ? mentorRepository.findByVerifiedTrue()
                : mentorRepository.findByVerifiedTrueAndCourses_Code(courseCode);

        return profiles.stream()
                .map(this::toResponse)
                .toList();
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
        MentorProfile profile = mentorRepository.findByUserId(userId)
                .orElseGet(() -> MentorProfile.builder().userId(userId).verified(false).build());

        profile.setTitle(request.title());
        profile.setBio(request.bio());
        profile.setCourses(request.courses());
        profile.setSkills(request.skills());
        profile.setLanguages(request.languages());
        profile.setAvailability(request.availability());

        profile = mentorRepository.save(profile);

        if (!user.getRoles().contains(Role.MENTOR)) {
            user.setRoles(EnumSet.copyOf(user.getRoles()));
            user.getRoles().add(Role.MENTOR);
            userRepository.save(user);
        }

        return mentorMapper.toResponse(profile, user);
    }

    private MentorProfileResponse toResponse(MentorProfile profile) {
        User user = userRepository.findById(profile.getUserId().toHexString())
                .orElseThrow(() -> new ResourceNotFoundException("Mentor user not found: " + profile.getUserId()));
        return mentorMapper.toResponse(profile, user);
    }
}
