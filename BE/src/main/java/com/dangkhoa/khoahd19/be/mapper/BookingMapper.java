package com.dangkhoa.khoahd19.be.mapper;

import com.dangkhoa.khoahd19.be.model.dto.BookingResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getMenteeId().toHexString(),
                booking.getMentorId().toHexString(),
                booking.getCourseCode(),
                booking.getFormat(),
                booking.getStartAt(),
                booking.getDurationMin(),
                booking.getPrice(),
                booking.getCommissionRate(),
                booking.getStatus(),
                booking.getEscrowTxnId() != null ? booking.getEscrowTxnId().toHexString() : null,
                booking.getCreatedAt(),
                booking.getTaughtAt()
        );
    }
}
