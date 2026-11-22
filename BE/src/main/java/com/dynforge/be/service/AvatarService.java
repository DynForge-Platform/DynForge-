package com.dynforge.be.service;

import com.dynforge.be.exception.BadRequestException;
import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.mapper.UserMapper;
import com.dynforge.be.model.dto.UserResponse;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.repository.UserRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import jakarta.servlet.http.HttpServletRequest;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

/**
 * Profile photos uploaded from the device. Files are kept in their own GridFS bucket (same MongoDB
 * database, so they survive redeploys) and served publicly at {@code /api/avatars/{id}} so that
 * plain {@code <img>} tags can show them everywhere (mentor cards, messages, admin tables…).
 */
@Service
public class AvatarService {

    public static final String BUCKET = "user_avatars";
    public static final String PUBLIC_PATH = "/api/avatars/";
    private static final long MAX_BYTES = 5L * 1024 * 1024; // the web app shrinks photos before upload
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final GridFsTemplate avatarFs;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public AvatarService(MongoDatabaseFactory factory, MongoConverter converter,
                         UserRepository userRepository, UserMapper userMapper) {
        // Built here (not as a bean) so it doesn't clash with the verification-documents GridFsTemplate.
        this.avatarFs = new GridFsTemplate(factory, converter, BUCKET);
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public record LoadedAvatar(String contentType, GridFsResource resource) { }

    public UserResponse upload(User user, MultipartFile file, HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Chưa chọn ảnh.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Ảnh quá lớn (tối đa 5 MB).");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
        }

        Document metadata = new Document()
                .append("ownerId", user.getId())
                .append("uploadedAt", Instant.now().toString());
        ObjectId id;
        try {
            id = avatarFs.store(file.getInputStream(), "avatar-" + user.getId(), contentType, metadata);
        } catch (IOException e) {
            throw new BadRequestException("Không lưu được ảnh, vui lòng thử lại.");
        }

        String previous = user.getAvatarUrl();
        user.setAvatarUrl(publicBaseUrl(request) + PUBLIC_PATH + id.toHexString());
        UserResponse response = userMapper.toResponse(userRepository.save(user));
        deleteOwnUpload(previous, user.getId());
        return response;
    }

    public LoadedAvatar load(String id) {
        if (!ObjectId.isValid(id)) {
            throw new ResourceNotFoundException("Avatar not found: " + id);
        }
        GridFSFile file = avatarFs.findOne(Query.query(Criteria.where("_id").is(new ObjectId(id))));
        if (file == null) {
            throw new ResourceNotFoundException("Avatar not found: " + id);
        }
        GridFsResource resource = avatarFs.getResource(file);
        Document metadata = file.getMetadata();
        String contentType = metadata != null && metadata.getString("_contentType") != null
                ? metadata.getString("_contentType")
                : resource.getContentType();
        return new LoadedAvatar(contentType, resource);
    }

    /** Removes the user's previous uploaded photo (only files we stored for that same user). */
    private void deleteOwnUpload(String previousUrl, String ownerId) {
        if (previousUrl == null) return;
        int i = previousUrl.indexOf(PUBLIC_PATH);
        if (i < 0) return;
        String oldId = previousUrl.substring(i + PUBLIC_PATH.length());
        if (!ObjectId.isValid(oldId)) return;
        try {
            avatarFs.delete(Query.query(Criteria.where("_id").is(new ObjectId(oldId))
                    .and("metadata.ownerId").is(ownerId)));
        } catch (RuntimeException ignored) {
            // an orphaned old photo is harmless
        }
    }

    /**
     * Absolute base URL of this API as the browser sees it. Azure/Render terminate TLS in front of the
     * app, so anything that isn't a local/dev host is published as https.
     */
    static String publicBaseUrl(HttpServletRequest request) {
        String host = request.getServerName();
        boolean local = host.equals("localhost") || host.equals("127.0.0.1") || host.equals("10.0.2.2")
                || host.startsWith("192.168.") || host.startsWith("10.");
        if (!local) {
            return "https://" + host + request.getContextPath();
        }
        int port = request.getServerPort();
        String portPart = (port == 80 || port == 443) ? "" : ":" + port;
        return request.getScheme() + "://" + host + portPart + request.getContextPath();
    }
}
