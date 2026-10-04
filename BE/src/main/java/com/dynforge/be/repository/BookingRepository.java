package com.dynforge.be.repository;

import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.enums.BookingStatus;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByMenteeId(ObjectId menteeId);

    List<Booking> findByMentorId(ObjectId mentorId);

    List<Booking> findByMentorIdAndStatusIn(ObjectId mentorId, Collection<BookingStatus> statuses);

    List<Booking> findByMenteeIdAndStatusIn(ObjectId menteeId, Collection<BookingStatus> statuses);

    /** Used by the auto-confirm scheduler to find TAUGHT bookings older than the cutoff. */
    List<Booking> findByStatusAndTaughtAtBefore(BookingStatus status, Instant cutoff);

    /** Used by timeout schedulers to find pending bookings older than cutoff. */
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, Instant cutoff);

    List<Booking> findByStatus(BookingStatus status);

    long countByStatus(BookingStatus status);

    long countByStatusIn(Collection<BookingStatus> statuses);
}
