package com.dynforge.be.service;

import com.dynforge.be.exception.ResourceNotFoundException;
import com.dynforge.be.model.dto.MentorMatchResponse;
import com.dynforge.be.model.dto.MentorProfileResponse;
import com.dynforge.be.model.dto.NoteRewriteResponse;
import com.dynforge.be.model.dto.SessionAskResponse;
import com.dynforge.be.model.entity.Booking;
import com.dynforge.be.model.entity.Course;
import com.dynforge.be.model.entity.Message;
import com.dynforge.be.model.entity.User;
import com.dynforge.be.model.enums.Role;
import com.dynforge.be.repository.BookingRepository;
import com.dynforge.be.repository.MessageRepository;
import com.dynforge.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Mentee-facing AI Service powered by Google Gemini API with Smart Java Stream Fallback:
 * (1) Matchmaker: Pre-filtered DB candidates -> Gemini API -> Suggested Questions.
 * (2) Post-session tutor & General Chatbot: Answers grounded in course & general platform assistance.
 * (3) Meeting note rewrite: Formats raw student notes into structured main points.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiMenteeService {

    private final MentorService mentorService;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final GeminiClient geminiClient;

    private static final Pattern MENTOR_TAG = Pattern.compile("M(\\d+)");

    // ── #1 Mentor matchmaker ──────────────────────────────────────────────────

    private static final String MATCH_SYSTEM = """
            Bạn là trợ lý tư vấn chọn gia sư thông minh cho DynForge — sàn kết nối gia sư và học viên đại học.
            Hãy đưa ra lời tư vấn ngắn gọn, mạch lạc, thân thiện bằng tiếng Việt (tư vấn giải pháp/lộ trình học tập và giải thích vì sao từng gia sư phù hợp).
            
            QUY TẮC BẮT BUỘC Ở 2 DÒNG CUỐI CÙNG:
            
            SUGGESTIONS: <câu hỏi gợi ý 1> | <câu hỏi gợi ý 2> | <câu hỏi gợi ý 3>
            
            LƯU Ý QUAN TRỌNG:
            - Trả lời đầy đủ, hoàn chỉnh bài tư vấn trước khi ghi 2 dòng MENTORS: và SUGGESTIONS:.
            - KHÔNG viết các mã thẻ như (M1), (M2) vào trong văn bản tư vấn chính.
            - Nếu học viên chỉ chào hỏi (như "hello", "hi", "xin chào"): Hãy chào lại và hỏi họ cần tìm gia sư môn gì (vd: PRJ301, MAL301, CSD201...). Ở dòng MENTORS: ghi "MENTORS:".
            """;

    public MentorMatchResponse matchMentors(String query) {
        List<MentorProfileResponse> allMentors = mentorService.listAllMentors();

        String trimmed = query.trim().toLowerCase();
        boolean isGreeting = List.of("hello", "hi", "xin chào", "chào", "chào bạn", "alo", "test", "giúp tôi", "tư vấn")
                .contains(trimmed);

        if (!geminiClient.isConfigured()) {
            return smartStreamFallbackMatch(query, allMentors);
        }

        try {
            // Step 1: Pre-filtering DB
            List<MentorProfileResponse> filteredMentors = preFilterMentors(query, allMentors);

            StringBuilder cat = new StringBuilder();
            for (int i = 0; i < filteredMentors.size(); i++) {
                cat.append("[M").append(i + 1).append("] ").append(describe(filteredMentors.get(i))).append('\n');
            }
            String prompt = "Học viên hỏi: " + query + "\n\nDanh sách gia sư hiện có:\n"
                    + (cat.length() == 0 ? "(Chưa tìm thấy gia sư nào.)" : cat);

            String text = geminiClient.complete(MATCH_SYSTEM, prompt, 2048).trim();
            List<MentorMatchResponse.Item> matches = parseMentorTags(text, filteredMentors);
            List<String> suggestions = parseSuggestions(text);
            String advice = stripMentorsAndSuggestions(text);

            if (isGreeting) {
                matches = List.of();
            }

            if (suggestions.isEmpty()) {
                suggestions = generateDefaultSuggestions(query, matches);
            }

            return new MentorMatchResponse(advice, matches, suggestions);
        } catch (Exception e) {
            log.warn("Gemini API call failed ({}), activating Smart Java Stream Fallback Engine.", e.getMessage());
            return smartStreamFallbackMatch(query, allMentors);
        }
    }

    private List<MentorProfileResponse> preFilterMentors(String query, List<MentorProfileResponse> mentors) {
        if (mentors.size() <= 10) return mentors;

        String q = query.toLowerCase();
        List<String> keywords = extractKeywords(q);

        return mentors.stream()
                .sorted(Comparator.comparingInt((MentorProfileResponse m) -> scoreMentor(m, keywords)).reversed()
                        .thenComparing(MentorProfileResponse::ratingAvg, Comparator.reverseOrder()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private int scoreMentor(MentorProfileResponse m, List<String> keywords) {
        String haystack = (nz(m.major()) + " " + nz(m.university()) + " " + nz(m.teachingRole())
                + " " + coursesText(m) + " " + String.join(" ", m.skills() == null ? List.of() : m.skills()))
                .toLowerCase();
        int score = 0;
        for (String k : keywords) {
            if (haystack.contains(k)) score += 3;
        }
        if (m.verified()) score += 2;
        return score;
    }

    private MentorMatchResponse smartStreamFallbackMatch(String query, List<MentorProfileResponse> mentors) {
        String q = query.toLowerCase().trim();

        boolean isGreeting = List.of("hello", "hi", "xin chào", "chào", "chào bạn", "alo", "test", "giúp tôi", "tư vấn")
                .contains(q);
        if (isGreeting) {
            String advice = "Chào bạn! Bạn đang cần tìm gia sư môn học nào (ví dụ: PRJ301, MAL301, CSD201...) hoặc đang gặp khó khăn gì trong học tập? Hãy nhập môn học để mình chọn gia sư phù hợp nhất nhé!";
            List<String> suggestions = List.of("Gia sư môn PRJ301", "Gia sư học phí tốt nhất", "Gia sư đánh giá 5 sao");
            return new MentorMatchResponse(advice, List.of(), suggestions);
        }

        boolean wantCheap = q.contains("rẻ") || q.contains("thấp") || q.contains("học phí ít") || q.contains("giá tốt");
        boolean wantRating = q.contains("giỏi") || q.contains("tốt nhất") || q.contains("rating") || q.contains("5 sao") || q.contains("uy tín");
        boolean wantOnline = q.contains("online") || q.contains("trực tuyến");
        boolean wantOffline = q.contains("offline") || q.contains("trực tiếp") || q.contains("tại chỗ");

        List<String> keywords = extractKeywords(q);

        record ScoredMentor(MentorProfileResponse m, int score, long minPrice, String reason) {}

        List<ScoredMentor> scoredList = mentors.stream()
                .map(m -> {
                    int score = scoreMentor(m, keywords);
                    long price = minRate(m);
                    boolean matchFormat = (!wantOnline || (m.formats() != null && m.formats().contains("Online")))
                            && (!wantOffline || (m.formats() != null && m.formats().contains("Offline")));
                    if (matchFormat) score += 1;

                    String reason;
                    if (score > 3) {
                        reason = "Rất phù hợp môn " + coursesText(m) + " (Đánh giá " + fmtRating(m) + ")";
                    } else if (wantCheap) {
                        reason = "Học phí ưu đãi từ " + String.format("%,d", price) + "₫/buổi";
                    } else if (wantRating) {
                        reason = "Được đánh giá cao " + fmtRating(m);
                    } else {
                        reason = "Gợi ý dựa trên môn giảng dạy (" + coursesText(m) + ")";
                    }
                    return new ScoredMentor(m, score, price, reason);
                })
                .sorted((a, b) -> {
                    if (wantCheap && a.minPrice != b.minPrice) {
                        return Long.compare(a.minPrice, b.minPrice);
                    }
                    if (wantRating && Double.compare(a.m.ratingAvg(), b.m.ratingAvg()) != 0) {
                        return Double.compare(b.m.ratingAvg(), a.m.ratingAvg());
                    }
                    if (a.score != b.score) {
                        return Integer.compare(b.score, a.score);
                    }
                    return Double.compare(b.m.ratingAvg(), a.m.ratingAvg());
                })
                .limit(3)
                .toList();

        List<MentorMatchResponse.Item> matches = scoredList.stream()
                .map(s -> new MentorMatchResponse.Item(s.m().id(), s.m().fullName(), s.reason()))
                .toList();

        StringBuilder advice = new StringBuilder("Dựa trên nhu cầu của bạn, hệ thống đã lọc được các gia sư phù hợp nhất:\n");
        for (ScoredMentor s : scoredList) {
            advice.append("• **").append(s.m().fullName()).append("** — ").append(s.reason())
                    .append(" (Học phí từ ").append(String.format("%,d", s.minPrice())).append("₫)\n");
        }
        if (matches.isEmpty()) {
            advice = new StringBuilder("Hiện chưa tìm thấy gia sư nào khớp chính xác với tiêu chí này.");
        }
        advice.append("\n───────────────\n💡 *Smart Fallback Engine (Java Stream Active).*");

        List<String> suggestedQuestions = generateDefaultSuggestions(query, matches);

        return new MentorMatchResponse(advice.toString(), matches, suggestedQuestions);
    }

    private List<String> extractKeywords(String text) {
        List<String> words = new ArrayList<>();
        for (String w : text.split("[^\\p{L}\\p{Nd}]+")) {
            if (w.length() >= 3 && !List.of("mình", "đang", "cần", "tìm", "cho", "học", "muốn").contains(w)) {
                words.add(w);
            }
        }
        return words;
    }

    private List<String> generateDefaultSuggestions(String query, List<MentorMatchResponse.Item> matches) {
        List<String> list = new ArrayList<>();
        if (!matches.isEmpty()) {
            list.add("Gia sư " + matches.get(0).name() + " dạy hình thức nào?");
        }
        list.add("Gia sư nào có học phí tốt nhất?");
        list.add("Làm sao để đặt lịch học 1-on-1?");
        return list;
    }

    private List<MentorMatchResponse.Item> parseMentorTags(String text, List<MentorProfileResponse> mentors) {
        List<MentorMatchResponse.Item> items = new ArrayList<>();
        for (String line : text.lines().toList()) {
            if (line.trim().toUpperCase().startsWith("MENTORS:")) {
                Matcher matcher = MENTOR_TAG.matcher(line);
                while (matcher.find()) {
                    int idx = Integer.parseInt(matcher.group(1)) - 1;
                    if (idx >= 0 && idx < mentors.size()) {
                        MentorProfileResponse m = mentors.get(idx);
                        boolean dup = items.stream().anyMatch(it -> it.mentorId().equals(m.id()));
                        if (!dup) items.add(new MentorMatchResponse.Item(m.id(), m.fullName(), "Phù hợp tiêu chí"));
                    }
                }
            }
        }
        return items;
    }

    private List<String> parseSuggestions(String text) {
        List<String> suggestions = new ArrayList<>();
        for (String line : text.lines().toList()) {
            if (line.trim().toUpperCase().startsWith("SUGGESTIONS:")) {
                String raw = line.trim().substring(12).trim();
                for (String part : raw.split("\\|")) {
                    String clean = part.trim();
                    if (!clean.isEmpty()) suggestions.add(clean);
                }
            }
        }
        return suggestions;
    }

    private String stripMentorsAndSuggestions(String text) {
        List<String> lines = text.lines()
                .filter(l -> !l.trim().toUpperCase().startsWith("MENTORS:") && !l.trim().toUpperCase().startsWith("SUGGESTIONS:"))
                .collect(Collectors.toList());
        String result = String.join("\n", lines).trim();
        return result.replaceAll("\\(M\\d+\\)", "").replaceAll("  ", " ");
    }

    private List<MentorMatchResponse.Item> topByRating(List<MentorProfileResponse> mentors, int n) {
        return mentors.stream()
                .sorted(Comparator.comparingDouble(MentorProfileResponse::ratingAvg).reversed())
                .limit(n)
                .map(m -> new MentorMatchResponse.Item(m.id(), m.fullName(), "Đánh giá cao (" + fmtRating(m) + ")"))
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

    // ── #2 Post-session tutor & General Chatbot ───────────────────────────────

    private static final String GENERAL_CHAT_SYSTEM = """
            Bạn là Trợ lý AI thông minh của DynForge — sàn kết nối gia sư và học viên đại học.
            Hãy trò chuyện lịch sự, thân thiện bằng tiếng Việt.
            - Nếu người dùng chào hỏi (như hello, hi, xin chào), hãy chào lại và giải thích bạn có thể giúp họ tìm gia sư, hướng dẫn nạp tiền PayOS, học trực tuyến hoặc giải đáp thắc mắc.
            - Dòng CUỐI CÙNG ghi 3 câu hỏi gợi ý theo định dạng:
              "SUGGESTIONS: <câu hỏi 1> | <câu hỏi 2> | <câu hỏi 3>"
            """;

    public SessionAskResponse generalChat(String message) {
        if (!geminiClient.isConfigured()) {
            String answer = "Chào bạn! Mình là Trợ lý AI DynForge. Bạn đang muốn tìm gia sư môn học nào hay cần hướng dẫn sử dụng tính năng gì trên hệ thống?";
            List<String> suggestions = List.of("Tìm gia sư môn PRJ301", "Quy trình thanh toán ký quỹ", "Học phí gia sư bao nhiêu?");
            return new SessionAskResponse(answer, suggestions);
        }
        try {
            String rawText = geminiClient.complete(GENERAL_CHAT_SYSTEM, message, 2048).trim();
            List<String> suggestions = parseSuggestions(rawText);
            String answer = stripMentorsAndSuggestions(rawText);
            if (suggestions.isEmpty()) {
                suggestions = List.of("Tìm gia sư môn PRJ301", "Cách nạp tiền ví PayOS", "Thanh toán ký quỹ hoạt động thế nào?");
            }
            return new SessionAskResponse(answer, suggestions);
        } catch (Exception e) {
            log.warn("Gemini API generalChat failed (quota/rate limit/error): {}. Falling back.", e.getMessage());
            String answer = "Chào bạn! Mình là Trợ lý AI DynForge. Bạn đang muốn tìm gia sư môn học nào hay cần hướng dẫn sử dụng tính năng gì trên hệ thống?";
            List<String> suggestions = List.of("Tìm gia sư môn PRJ301", "Quy trình thanh toán ký quỹ", "Học phí gia sư bao nhiêu?");
            return new SessionAskResponse(answer, suggestions);
        }
    }

    private static final String ASK_SYSTEM = """
            Bạn là trợ lý học tập AI của DynForge, giúp học viên ôn luyện bám sát sau buổi học với gia sư.
            Hãy giải thích rõ ràng, dễ hiểu, trình bày bằng Markdown tiếng Việt.
            Dòng CUỐI CÙNG luôn kèm 3 câu hỏi gợi ý ôn tập theo định dạng:
            "SUGGESTIONS: <câu hỏi 1> | <câu hỏi 2> | <câu hỏi 3>"
            """;

    public SessionAskResponse askAboutSession(User user, String bookingId, String question) {
        Booking b = requireParticipant(user, bookingId);

        String menteeName = userRepository.findById(b.getMenteeId().toHexString())
                .map(User::getFullName).orElse("Học viên");
        String mentorName = userRepository.findById(b.getMentorId().toHexString())
                .map(User::getFullName).orElse("Gia sư");
        String chat = buildChatTranscript(b.getMenteeId(), b.getMentorId(), menteeName, mentorName);

        if (!geminiClient.isConfigured()) {
            return mockAsk(b, question);
        }

        try {
            String prompt = "BUỔI HỌC\n"
                    + "- Môn: " + nz(b.getCourseCode()) + "\n"
                    + "- Gia sư: " + mentorName + " · Học viên: " + menteeName + "\n\n"
                    + "NỘI DUNG TRAO ĐỔI GIỮA HAI BÊN\n"
                    + (chat.isBlank() ? "(Không có tin nhắn chat nào trong hệ thống.)" : chat) + "\n\n"
                    + "CÂU HỎI CỦA HỌC VIÊN:\n" + question;

            String rawText = geminiClient.complete(ASK_SYSTEM, prompt, 2048).trim();
            List<String> suggestions = parseSuggestions(rawText);
            String answer = stripMentorsAndSuggestions(rawText);

            if (suggestions.isEmpty()) {
                suggestions = List.of(
                        "Buổi học môn " + nz(b.getCourseCode()) + " có bài tập về nhà không?",
                        "Cho mình xin tóm tắt lại các công thức quan trọng",
                        "Làm sao để đặt tiếp một buổi kèm môn này?"
                );
            }

            return new SessionAskResponse(answer, suggestions);
        } catch (Exception e) {
            log.warn("Gemini API askAboutSession failed: {}. Falling back.", e.getMessage());
            return mockAsk(b, question);
        }
    }

    private SessionAskResponse mockAsk(Booking b, String question) {
        String answer = String.join("\n",
                "Về câu hỏi \"" + question.trim() + "\" (môn " + nz(b.getCourseCode()) + "):",
                "",
                "Bạn nên kiểm tra lại phần ghi chú buổi học hoặc đặt thêm một câu hỏi chi tiết hơn cho gia sư.",
                "",
                "───────────────",
                "💡 *Smart Fallback Engine Active: Hệ thống tự động phản hồi mượt mà.*"
        );
        List<String> suggestions = List.of(
                "Tóm tắt các kiến thức cốt lõi môn " + nz(b.getCourseCode()),
                "Các dạng bài tập hay xuất hiện trong đề thi?",
                "Hỏi thêm gia sư qua khung tin nhắn 1-1"
        );
        return new SessionAskResponse(answer, suggestions);
    }

    // ── #3 In-meeting note rewrite ─────────────────────────────────────────────

    private static final String NOTE_SYSTEM = """
            Bạn là trợ lý ghi chú học tập của DynForge.
            Hãy VIẾT LẠI ghi chú thô của học viên BẰNG TIẾNG VIỆT rõ ràng, chuyên nghiệp:
            - **Nội dung chính**: Ý chính ngắn gọn.
            - **Việc cần làm / Bài tập**: Các mục action item.
            - **Câu hỏi cần giải đáp thêm**: Các điểm chưa rõ.
            """;

    public NoteRewriteResponse rewriteNote(User user, String bookingId, String notes) {
        Booking b = requireParticipant(user, bookingId);

        if (!geminiClient.isConfigured()) {
            return new NoteRewriteResponse(mockNote(b, notes));
        }

        try {
            String prompt = "MÔN HỌC: " + nz(b.getCourseCode()) + "\n\nGHI CHÚ TRONG BUỔI HỌC:\n" + notes;
            return new NoteRewriteResponse(geminiClient.complete(NOTE_SYSTEM, prompt, 2048).trim());
        } catch (Exception e) {
            log.warn("Gemini API rewriteNote failed: {}. Falling back.", e.getMessage());
            return new NoteRewriteResponse(mockNote(b, notes));
        }
    }

    private String mockNote(Booking b, String notes) {
        return String.join("\n",
                "### GHI CHÚ BUỔI HỌC — Môn " + nz(b.getCourseCode()),
                "",
                "**Nội dung chính:**",
                "- " + notes.trim().replace("\n", "\n- "),
                "",
                "───────────────",
                "💡 *Smart Fallback Engine Active.*"
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
