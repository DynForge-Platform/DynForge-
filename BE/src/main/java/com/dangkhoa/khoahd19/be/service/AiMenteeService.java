package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.ResourceNotFoundException;
import com.dangkhoa.khoahd19.be.model.dto.MentorMatchResponse;
import com.dangkhoa.khoahd19.be.model.dto.MentorProfileResponse;
import com.dangkhoa.khoahd19.be.model.dto.NoteRewriteResponse;
import com.dangkhoa.khoahd19.be.model.dto.SessionAskResponse;
import com.dangkhoa.khoahd19.be.model.entity.Booking;
import com.dangkhoa.khoahd19.be.model.entity.Course;
import com.dangkhoa.khoahd19.be.model.entity.Message;
import com.dangkhoa.khoahd19.be.model.entity.User;
import com.dangkhoa.khoahd19.be.model.enums.Role;
import com.dangkhoa.khoahd19.be.repository.BookingRepository;
import com.dangkhoa.khoahd19.be.repository.MessageRepository;
import com.dangkhoa.khoahd19.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mentee-facing AI: (1) recommend the right human mentor from the real pool, and (2) let a mentee
 * ask follow-up questions grounded in a past session. Both run on Claude when configured, and fall
 * back to a labelled heuristic demo otherwise — so the marketplace, not a bot, stays the point.
 */
@Service
@RequiredArgsConstructor
public class AiMenteeService {

    private final MentorService mentorService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ClaudeClient claudeClient;

    private static final Pattern MENTOR_TAG = Pattern.compile("M(\\d+)");

    // ── #1 Mentor matchmaker ──────────────────────────────────────────────────

    private static final String MATCH_SYSTEM = """
            Bạn là trợ lý tư vấn chọn gia sư cho GRADORA — sàn kết nối gia sư/mentor học thuật.
            Dựa trên nhu cầu của học viên và DANH SÁCH GIA SƯ bên dưới, hãy chọn 2-3 gia sư phù hợp
            nhất và giải thích ngắn gọn vì sao mỗi người phù hợp (môn, vai trò, đánh giá, hình thức,
            học phí). Trả lời BẰNG TIẾNG VIỆT, thân thiện, súc tích.
            BẮT BUỘC: dòng ĐẦU TIÊN chỉ ghi mã các gia sư được chọn theo thẻ [M#], ví dụ
            "MENTORS: M1, M3". Từ dòng thứ hai trở đi là phần tư vấn cho học viên.
            Nếu không có gia sư nào thật sự phù hợp, hãy nói rõ và gợi ý học viên nới tiêu chí.
            """;

    public MentorMatchResponse matchMentors(String query) {
        List<MentorProfileResponse> mentors = mentorService.listAllMentors();

        if (!claudeClient.isConfigured()) {
            return mockMatch(query, mentors);
        }

        StringBuilder cat = new StringBuilder();
        for (int i = 0; i < mentors.size(); i++) {
            cat.append("[M").append(i + 1).append("] ").append(describe(mentors.get(i))).append('\n');
        }
        String prompt = "NHU CẦU CỦA HỌC VIÊN:\n" + query + "\n\nDANH SÁCH GIA SƯ:\n"
                + (cat.length() == 0 ? "(Chưa có gia sư nào.)" : cat);

        String text = claudeClient.complete(MATCH_SYSTEM, prompt, 1200).trim();
        List<MentorMatchResponse.Item> matches = parseMentorTags(text, mentors);
        String advice = stripMentorsLine(text);
        if (matches.isEmpty()) {
            matches = topByRating(mentors, 3);
        }
        return new MentorMatchResponse(advice, matches);
    }

    private MentorMatchResponse mockMatch(String query, List<MentorProfileResponse> mentors) {
        String q = query.toLowerCase();
        List<String> words = new ArrayList<>();
        for (String w : q.split("[^\\p{L}\\p{Nd}]+")) {
            if (w.length() >= 3) words.add(w);
        }

        record Scored(MentorProfileResponse m, int score, String reason) {}
        List<Scored> scored = new ArrayList<>();
        for (MentorProfileResponse m : mentors) {
            String hay = (nz(m.major()) + " " + nz(m.university()) + " " + nz(m.teachingRole())
                    + " " + coursesText(m) + " " + String.join(" ", m.skills() == null ? List.of() : m.skills()))
                    .toLowerCase();
            int score = 0;
            for (String w : words) if (hay.contains(w)) score++;
            String reason = score > 0
                    ? "Phù hợp với nhu cầu của bạn (" + coursesText(m) + "), đánh giá " + fmtRating(m) + "."
                    : "Gợi ý theo đánh giá cao (" + fmtRating(m) + ").";
            scored.add(new Scored(m, score, reason));
        }
        scored.sort(Comparator
                .comparingInt((Scored s) -> s.score()).reversed()
                .thenComparing(s -> s.m().ratingAvg(), Comparator.reverseOrder()));

        List<Scored> top = scored.stream().limit(3).toList();
        List<MentorMatchResponse.Item> matches = top.stream()
                .map(s -> new MentorMatchResponse.Item(s.m().id(), s.m().fullName(), s.reason()))
                .toList();

        StringBuilder advice = new StringBuilder("Dựa trên nhu cầu của bạn, đây là các gia sư gợi ý:\n");
        for (Scored s : top) {
            advice.append("• ").append(s.m().fullName()).append(" — ").append(s.reason()).append('\n');
        }
        if (matches.isEmpty()) {
            advice = new StringBuilder("Hiện chưa có gia sư nào trên hệ thống để gợi ý.");
        }
        advice.append("\n───────────────\n⚠️ DỮ LIỆU MẪU (DEMO): chưa cấu hình anthropic.api-key nên gợi ý ")
                .append("được tạo bằng quy tắc khớp từ khoá. Thêm API key để Claude tư vấn thông minh hơn.");

        return new MentorMatchResponse(advice.toString(), matches);
    }

    private List<MentorMatchResponse.Item> parseMentorTags(String text, List<MentorProfileResponse> mentors) {
        String firstLine = text.lines().findFirst().orElse("");
        if (!firstLine.toUpperCase().contains("MENTOR")) return List.of();

        List<MentorMatchResponse.Item> items = new ArrayList<>();
        Matcher matcher = MENTOR_TAG.matcher(firstLine);
        while (matcher.find()) {
            int idx = Integer.parseInt(matcher.group(1)) - 1;
            if (idx >= 0 && idx < mentors.size()) {
                MentorProfileResponse m = mentors.get(idx);
                boolean dup = items.stream().anyMatch(it -> it.mentorId().equals(m.id()));
                if (!dup) items.add(new MentorMatchResponse.Item(m.id(), m.fullName(), ""));
            }
        }
        return items;
    }

    private String stripMentorsLine(String text) {
        String firstLine = text.lines().findFirst().orElse("");
        if (firstLine.toUpperCase().startsWith("MENTORS")) {
            int nl = text.indexOf('\n');
            return nl >= 0 ? text.substring(nl + 1).trim() : "";
        }
        return text;
    }

    private List<MentorMatchResponse.Item> topByRating(List<MentorProfileResponse> mentors, int n) {
        return mentors.stream()
                .sorted(Comparator.comparingDouble(MentorProfileResponse::ratingAvg).reversed())
                .limit(n)
                .map(m -> new MentorMatchResponse.Item(m.id(), m.fullName(),
                        "Đánh giá cao (" + fmtRating(m) + ")."))
                .toList();
    }

    private String describe(MentorProfileResponse m) {
        return m.fullName()
                + " — " + nz(m.major()) + ", " + nz(m.university())
                + ", vai trò: " + nz(m.teachingRole())
                + (m.verified() ? ", ĐÃ xác minh" : ", chưa xác minh")
                + ", đánh giá " + fmtRating(m)
                + ", môn: " + coursesText(m)
                + ", học phí từ " + minRate(m) + " VND"
                + ", hình thức: " + String.join("/", m.formats() == null ? List.of() : m.formats());
    }

    private String coursesText(MentorProfileResponse m) {
        if (m.courses() == null || m.courses().isEmpty()) return "—";
        StringBuilder sb = new StringBuilder();
        for (Course c : m.courses()) {
            if (sb.length() > 0) sb.append("; ");
            sb.append(c.getCode()).append(" ").append(nz(c.getName()));
            if (c.getGrade() != null && !c.getGrade().isBlank()) sb.append(" (").append(c.getGrade()).append(")");
        }
        return sb.toString();
    }

    private long minRate(MentorProfileResponse m) {
        if (m.courses() == null || m.courses().isEmpty()) return 0;
        return m.courses().stream().mapToLong(Course::getRatePrivate).min().orElse(0);
    }

    private String fmtRating(MentorProfileResponse m) {
        return String.format("%.1f", m.ratingAvg()) + " (" + m.ratingCount() + " lượt)";
    }

    // ── #2 Post-session tutor ─────────────────────────────────────────────────

    private static final String ASK_SYSTEM = """
            Bạn là trợ lý học tập của GRADORA, giúp học viên ôn lại sau buổi học với gia sư.
            Trả lời câu hỏi của học viên BẰNG TIẾNG VIỆT, bám sát nội dung buổi học được cung cấp
            (môn học và phần trao đổi giữa hai bên). Giải thích rõ ràng, dễ hiểu, có ví dụ khi cần.
            Nếu câu hỏi vượt quá phạm vi buổi học hoặc cần kèm sâu hơn, hãy trả lời trong khả năng và
            gợi ý học viên đặt thêm buổi học với gia sư.
            """;

    public SessionAskResponse askAboutSession(User user, String bookingId, String question) {
        Booking b = requireParticipant(user, bookingId);

        String menteeName = userRepository.findById(b.getMenteeId().toHexString())
                .map(User::getFullName).orElse("Học viên");
        String mentorName = userRepository.findById(b.getMentorId().toHexString())
                .map(User::getFullName).orElse("Gia sư");
        String chat = buildChatTranscript(b.getMenteeId(), b.getMentorId(), menteeName, mentorName);

        if (!claudeClient.isConfigured()) {
            return mockAsk(b, question);
        }

        String prompt = "BUỔI HỌC\n"
                + "- Môn: " + nz(b.getCourseCode()) + "\n"
                + "- Gia sư: " + mentorName + " · Học viên: " + menteeName + "\n\n"
                + "NỘI DUNG TRAO ĐỔI GIỮA HAI BÊN\n"
                + (chat.isBlank() ? "(Không có tin nhắn nào.)" : chat) + "\n\n"
                + "CÂU HỎI CỦA HỌC VIÊN:\n" + question;

        String answer = claudeClient.complete(ASK_SYSTEM, prompt, 1200).trim();
        return new SessionAskResponse(answer);
    }

    private SessionAskResponse mockAsk(Booking b, String question) {
        String answer = String.join("\n",
                "Về câu hỏi \"" + question.trim() + "\" (môn " + nz(b.getCourseCode()) + "):",
                "",
                "Đây là bản trả lời mẫu. Bạn nên xem lại phần ghi chú/tóm tắt của buổi học này, và nếu "
                        + "vẫn chưa rõ, hãy đặt thêm một buổi với gia sư để được kèm chi tiết hơn.",
                "",
                "───────────────",
                "⚠️ DỮ LIỆU MẪU (DEMO): chưa cấu hình anthropic.api-key nên chưa có lời giải thật từ Claude. "
                        + "Thêm API key để hỏi đáp bám sát nội dung buổi học."
        );
        return new SessionAskResponse(answer);
    }

    // ── #3 In-meeting note rewrite ─────────────────────────────────────────────

    private static final String NOTE_SYSTEM = """
            Bạn là trợ lý ghi chú của GRADORA. Người dùng đang trong buổi học trực tuyến và đã ghi
            chú nhanh, lộn xộn. Hãy VIẾT LẠI ghi chú BẰNG TIẾNG VIỆT thành nội dung chính rõ ràng:
            - "Nội dung chính": các ý quan trọng, gạch đầu dòng ngắn gọn.
            - "Việc cần làm / bài tập": nếu ghi chú có nhắc đến.
            - "Câu hỏi còn lại": nếu có điểm chưa rõ.
            Chỉ dựa trên ghi chú được đưa, không bịa thêm. Giữ thuật ngữ chuyên môn nguyên bản.
            """;

    public NoteRewriteResponse rewriteNote(User user, String bookingId, String notes) {
        Booking b = requireParticipant(user, bookingId);

        if (!claudeClient.isConfigured()) {
            return new NoteRewriteResponse(mockNote(b, notes));
        }
        String prompt = "MÔN HỌC: " + nz(b.getCourseCode()) + "\n\nGHI CHÚ TRONG BUỔI HỌC:\n" + notes;
        return new NoteRewriteResponse(claudeClient.complete(NOTE_SYSTEM, prompt, 1200).trim());
    }

    private String mockNote(Booking b, String notes) {
        return String.join("\n",
                "GHI CHÚ BUỔI HỌC — Môn " + nz(b.getCourseCode()),
                "",
                "Nội dung chính:",
                "- " + notes.trim().replace("\n", "\n- "),
                "",
                "───────────────",
                "⚠️ DỮ LIỆU MẪU (DEMO): chưa cấu hình anthropic.api-key nên ghi chú chỉ được sắp xếp lại. "
                        + "Thêm API key để Claude viết lại nội dung chính mạch lạc hơn."
        );
    }

    private Booking requireParticipant(User user, String bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        String uid = user.getId();
        boolean participant = b.getMenteeId().toHexString().equals(uid)
                || b.getMentorId().toHexString().equals(uid);
        if (!participant && !user.getRoles().contains(Role.ADMIN)) {
            throw new AccessDeniedException("You do not have access to this booking");
        }
        return b;
    }

    private String buildChatTranscript(ObjectId menteeId, ObjectId mentorId,
                                       String menteeName, String mentorName) {
        List<Message> thread = new ArrayList<>();
        thread.addAll(messageRepository.findBySenderIdAndRecipientId(menteeId, mentorId));
        thread.addAll(messageRepository.findBySenderIdAndRecipientId(mentorId, menteeId));
        thread.sort(Comparator.comparing(Message::getCreatedAt));

        StringBuilder sb = new StringBuilder();
        for (Message m : thread) {
            String who = m.getSenderId().equals(menteeId) ? menteeName : mentorName;
            sb.append(who).append(": ").append(m.getContent()).append('\n');
        }
        return sb.toString();
    }

    private String nz(String s) {
        return s == null || s.isBlank() ? "—" : s;
    }
}
