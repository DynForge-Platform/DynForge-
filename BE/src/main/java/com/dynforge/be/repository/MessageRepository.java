package com.dynforge.be.repository;

import com.dynforge.be.model.entity.Message;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findBySenderIdAndRecipientId(ObjectId senderId, ObjectId recipientId);

    /** All messages involving a user (pass the same id for both params). */
    List<Message> findBySenderIdOrRecipientId(ObjectId senderId, ObjectId recipientId);
}
