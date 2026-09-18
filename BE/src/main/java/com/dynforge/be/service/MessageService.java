package com.dynforge.be.service;

import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.model.dto.ConversationDetailResponse;
import com.dynforge.be.model.dto.ConversationResponse;
import com.dynforge.be.model.dto.MessageResponse;
import com.dynforge.be.model.dto.SendMessageRequest;
import com.dynforge.be.model.entity.Message;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.repository.MessageRepository;
import com.dynforge.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageResponse send(User sender, SendMessageRequest request) {
        if (!ObjectId.isValid(request.recipientId())) {
            throw new ResourceNotFoundException("Recipient not found: " + request.recipientId());
        }
        ObjectId recipientId = new ObjectId(request.recipientId());
        if (recipientId.toHexString().equals(sender.getId())) {
            throw new ResourceNotFoundException("You cannot message yourself");
        }
        userRepository.findById(recipientId.toHexString())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        Message msg = messageRepository.save(Message.builder()
                .senderId(new ObjectId(sender.getId()))
                .recipientId(recipientId)
                .content(request.content())
                .read(false)
                .createdAt(Instant.now())
                .build());

        return toResponse(msg, sender.getId());
    }

    /** Returns the full thread with a user, marking their messages to me as read. */
    public ConversationDetailResponse getConversation(User me, String otherUserId) {
        if (!ObjectId.isValid(otherUserId)) {
            throw new ResourceNotFoundException("User not found: " + otherUserId);
        }
        ObjectId meId = new ObjectId(me.getId());
        ObjectId otherId = new ObjectId(otherUserId);

        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Message> thread = new ArrayList<>();
        thread.addAll(messageRepository.findBySenderIdAndRecipientId(meId, otherId));
        thread.addAll(messageRepository.findBySenderIdAndRecipientId(otherId, meId));
        thread.sort(Comparator.comparing(Message::getCreatedAt));

        // Mark messages from the other user as read.
        List<Message> toMark = thread.stream()
                .filter(m -> m.getRecipientId().equals(meId) && !m.isRead())
                .peek(m -> m.setRead(true))
                .toList();
        if (!toMark.isEmpty()) messageRepository.saveAll(toMark);

        List<MessageResponse> messages = thread.stream()
                .map(m -> toResponse(m, me.getId()))
                .toList();

        var brief = new ConversationDetailResponse.UserBrief(
                other.getId(), other.getFullName(), other.getAvatarUrl());
        return new ConversationDetailResponse(brief, messages);
    }

    /** One entry per person I've exchanged messages with, newest first. */
    public List<ConversationResponse> listConversations(User me) {
        ObjectId meId = new ObjectId(me.getId());
        List<Message> all = messageRepository.findBySenderIdOrRecipientId(meId, meId);

        // Group by the other participant, preserving newest-first ordering.
        Map<String, List<Message>> byOther = new LinkedHashMap<>();
        all.sort(Comparator.comparing(Message::getCreatedAt).reversed());
        for (Message m : all) {
            ObjectId otherId = m.getSenderId().equals(meId) ? m.getRecipientId() : m.getSenderId();
            byOther.computeIfAbsent(otherId.toHexString(), k -> new ArrayList<>()).add(m);
        }

        List<ConversationResponse> result = new ArrayList<>();
        for (Map.Entry<String, List<Message>> e : byOther.entrySet()) {
            User other = userRepository.findById(e.getKey()).orElse(null);
            if (other == null) continue;
            Message last = e.getValue().get(0); // already newest-first
            long unread = e.getValue().stream()
                    .filter(m -> m.getRecipientId().equals(meId) && !m.isRead())
                    .count();
            result.add(new ConversationResponse(
                    other.getId(), other.getFullName(), other.getAvatarUrl(),
                    last.getContent(), last.getCreatedAt(), unread));
        }
        result.sort(Comparator.comparing(ConversationResponse::lastAt).reversed());
        return result;
    }

    private MessageResponse toResponse(Message m, String myId) {
        return new MessageResponse(
                m.getId(),
                m.getSenderId().toHexString(),
                m.getRecipientId().toHexString(),
                m.getContent(),
                m.getSenderId().toHexString().equals(myId),
                m.isRead(),
                m.getCreatedAt()
        );
    }
}
