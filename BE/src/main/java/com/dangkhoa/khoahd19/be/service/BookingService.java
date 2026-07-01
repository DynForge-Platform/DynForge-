package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.mapper.BookingMapper;
import com.dangkhoa.khoahd19.be.model.dto.BookingRequest;
import com.dangkhoa.khoahd19.be.model.dto.BookingResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.BookingStatus;
import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.repository.MentorRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final double DEFAULT_COMMISSION_RATE = 0.15;

    private final BookingRepository bookingRepository;
    private final MentorRepository mentorRepository;
    private final BookingMapper bookingMapper;

    public BookingResponse create(User mentee, BookingRequest request) {
        ObjectId mentorUserId = new ObjectId(request.mentorId());

        if (mentorUserId.toHexString().equals(mentee.getId())) {
            throw new BadRequestException("You cannot book a session with yourself");
        }
        if (mentorRepository.findByUserId(mentorUserId).isEmpty()) {
            throw new ResourceNotFoundException("Mentor not found: " + request.mentorId());
        }

        Booking booking = Booking.builder()
                .menteeId(new ObjectId(mentee.getId()))
                .mentorId(mentorUserId)
                .courseCode(request.courseCode())
                .format(request.format())
                .startAt(request.startAt())
                .durationMin(request.durationMin())
                .price(request.price())
                .commissionRate(DEFAULT_COMMISSION_RATE)
                .status(BookingStatus.PENDING_PAYMENT)
                .createdAt(Instant.now())
                .build();

        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> listMine(User user) {
        ObjectId userId = new ObjectId(user.getId());

        Map<String, Booking> byId = new LinkedHashMap<>();
        bookingRepository.findByMenteeId(userId).forEach(b -> byId.put(b.getId(), b));
        bookingRepository.findByMentorId(userId).forEach(b -> byId.put(b.getId(), b));

        return byId.values().stream()
                .sorted(Comparator.comparing(Booking::getStartAt).reversed())
                .map(bookingMapper::toResponse)
                .toList();
    }

    public BookingResponse getById(User user, String id) {
        Booking booking = findOwned(user, id);
        return bookingMapper.toResponse(booking);
    }

    public BookingResponse cancel(User user, String id) {
        Booking booking = findOwned(user, id);

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.ESCROW_HELD) {
            throw new BadRequestException("Booking in status " + booking.getStatus() + " cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    private Booking findOwned(User user, String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + id));

        String userId = user.getId();
        boolean isParticipant = booking.getMenteeId().toHexString().equals(userId)
                || booking.getMentorId().toHexString().equals(userId);
        boolean isAdmin = user.getRoles().contains(Role.ADMIN);

        if (!isParticipant && !isAdmin) {
            throw new AccessDeniedException("You do not have access to this booking");
        }

        return booking;
    }
}
