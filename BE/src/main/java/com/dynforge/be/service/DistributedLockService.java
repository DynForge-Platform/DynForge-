package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Supplier;

@Slf4j
@Service
@RequiredArgsConstructor
public class DistributedLockService {

    private static final String LOCK_COLLECTION = "distributed_locks";
    private final MongoTemplate mongoTemplate;

    /**
     * Executes a task while holding a distributed lock for the specified lock key.
     *
     * @param lockKey       Unique key identifying the lock (e.g. "mentor:123")
     * @param waitTimeout   Max duration to wait for lock acquisition
     * @param leaseDuration Duration after which lock automatically expires if not released
     * @param task          The task to execute
     * @return The task result
     */
    public <T> T executeWithLock(String lockKey, Duration waitTimeout, Duration leaseDuration, Supplier<T> task) {
        String token = UUID.randomUUID().toString();
        Instant deadline = Instant.now().plus(waitTimeout);

        boolean acquired = false;
        while (!acquired && Instant.now().isBefore(deadline)) {
            acquired = tryAcquire(lockKey, token, leaseDuration);
            if (!acquired) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted while waiting for lock: " + lockKey, e);
                }
            }
        }

        if (!acquired) {
            log.warn("Failed to acquire distributed lock for key '{}' within {} ms", lockKey, waitTimeout.toMillis());
            throw new BadRequestException("Hệ thống đang xử lý yêu cầu đặt lịch/đổi lịch khác cho giảng viên này. Vui lòng thử lại sau giây lát.");
        }

        try {
            return task.get();
        } finally {
            release(lockKey, token);
        }
    }

    public void executeWithLock(String lockKey, Duration waitTimeout, Duration leaseDuration, Runnable task) {
        executeWithLock(lockKey, waitTimeout, leaseDuration, () -> {
            task.run();
            return null;
        });
    }

    private boolean tryAcquire(String lockKey, String token, Duration leaseDuration) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(leaseDuration);

        // 1. Try to insert new lock document
        try {
            Document doc = new Document("_id", lockKey)
                    .append("token", token)
                    .append("acquiredAt", now)
                    .append("expiresAt", expiresAt);
            mongoTemplate.insert(doc, LOCK_COLLECTION);
            return true;
        } catch (DuplicateKeyException e) {
            // Document already exists, check if expired
        } catch (Exception e) {
            log.warn("Error attempting to insert lock '{}': {}", lockKey, e.getMessage());
        }

        // 2. Try to takeover expired lock
        try {
            Query query = new Query(Criteria.where("_id").is(lockKey)
                    .and("expiresAt").lte(now));
            Update update = new Update()
                    .set("token", token)
                    .set("acquiredAt", now)
                    .set("expiresAt", expiresAt);

            Document existing = mongoTemplate.findAndModify(
                    query, update,
                    FindAndModifyOptions.options().returnNew(true),
                    Document.class, LOCK_COLLECTION
            );
            return existing != null;
        } catch (Exception e) {
            log.warn("Error attempting to takeover lock '{}': {}", lockKey, e.getMessage());
            return false;
        }
    }

    private void release(String lockKey, String token) {
        try {
            Query query = new Query(Criteria.where("_id").is(lockKey).and("token").is(token));
            mongoTemplate.remove(query, LOCK_COLLECTION);
        } catch (Exception e) {
            log.error("Failed to release lock '{}' with token '{}': {}", lockKey, token, e.getMessage());
        }
    }
}
