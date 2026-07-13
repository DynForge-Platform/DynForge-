package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.model.dto.RecordingResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.entity.Recording;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.repository.RecordingRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecordingService {

    private final RecordingRepository recordingRepository;
    private final BookingRepository bookingRepository;

    @Value("${app.recordings.dir:./recordings}")
    private String recordingsDir;

    public RecordingResponse save(User uploader, String bookingId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Recording file is empty");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        boolean participant = booking.getMenteeId().toHexString().equals(uploader.getId())
                || booking.getMentorId().toHexString().equals(uploader.getId());
        if (!participant && !uploader.getRoles().contains(Role.ADMIN)) {
            throw new BadRequestException("Only a session participant can upload its recording");
        }

        try {
            Path dir = Paths.get(recordingsDir);
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + ".webm";
            Files.copy(file.getInputStream(), dir.resolve(storedName));

            Recording rec = recordingRepository.save(Recording.builder()
                    .bookingId(new ObjectId(bookingId))
                    .uploaderId(new ObjectId(uploader.getId()))
                    .uploaderName(uploader.getFullName())
                    .courseCode(booking.getCourseCode())
                    .filename(storedName)
                    .contentType(file.getContentType() != null ? file.getContentType() : "video/webm")
                    .size(file.getSize())
                    .createdAt(Instant.now())
                    .build());

            return toResponse(rec);
        } catch (IOException e) {
            throw new BadRequestException("Could not store recording: " + e.getMessage());
        }
    }

    public List<RecordingResponse> listAll() {
        return recordingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    /** Returns the stored file resource + its recording metadata (for admin/participant download). */
    public LoadedFile loadFile(String id) {
        Recording rec = recordingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recording not found: " + id));
        Path path = Paths.get(recordingsDir).resolve(rec.getFilename());
        Resource resource = new FileSystemResource(path);
        if (!resource.exists()) {
            throw new ResourceNotFoundException("Recording file missing on disk");
        }
        return new LoadedFile(rec, resource);
    }

    private RecordingResponse toResponse(Recording r) {
        return new RecordingResponse(
                r.getId(),
                r.getBookingId().toHexString(),
                r.getCourseCode(),
                r.getUploaderName(),
                r.getContentType(),
                r.getSize(),
                r.getCreatedAt()
        );
    }

    public record LoadedFile(Recording recording, Resource resource) {
    }
}
