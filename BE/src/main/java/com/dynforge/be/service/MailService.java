package com.dynforge.be.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Sends transactional email via SMTP (Brevo / Gmail App Password). When spring.mail.username
 * is left blank the service falls back to logging the content — same dev behaviour as before,
 * so the app keeps working without a mail account.
 */
@Slf4j
@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String username;
    private final String fromEmail;
    private final String senderName;
    private final String frontendBaseUrl;

    public MailService(JavaMailSender mailSender,
                       @Value("${spring.mail.username:}") String username,
                       @Value("${app.mail.from:}") String fromEmail,
                       @Value("${app.mail.sender-name:DynForge Support}") String senderName,
                       @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.mailSender = mailSender;
        this.username = username;
        this.fromEmail = fromEmail;
        this.senderName = senderName;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public boolean isConfigured() {
        return username != null && !username.isBlank();
    }

    /** Sends the password-reset OTP. Falls back to logging when SMTP is not configured. */
    public void sendOtpEmail(String to, String otp, long validMinutes) {
        if (!isConfigured()) {
            log.info("[OTP] Password reset code for {} is: {} (mail not configured — logged only)", to, otp);
            return;
        }
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;\
                border:1px solid #e5e7eb;border-radius:12px">
                  <h2 style="color:#1e3acc;margin:0 0 8px">DynForge</h2>
                  <p>Xin chào,</p>
                  <p>Mã xác thực (OTP) để đặt lại mật khẩu của bạn là:</p>
                  <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;\
                color:#1e3acc;margin:16px 0">%s</p>
                  <p>Mã có hiệu lực trong <b>%d phút</b>. Nếu bạn không yêu cầu đặt lại mật khẩu,
                  hãy bỏ qua email này.</p>
                  <p style="color:#6b7280;font-size:12px;margin-top:24px">DynForge — Nền tảng kết nối
                  mentor học thuật.</p>
                </div>
                """.formatted(otp, validMinutes);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : username;
            helper.setFrom(sender, senderName);
            helper.setTo(to);
            helper.setSubject("DynForge - Mã OTP đặt lại mật khẩu: " + otp);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("OTP email sent to {} from {}", to, sender);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Sends an automated email to the mentee when booking and payment into escrow succeed.
     * Contains full detailed time schedule (Vietnam Time - GMT+7), course info, mentor name,
     * and classroom entry link.
     */
    @Async
    public void sendBookingPaymentSuccessEmail(
            String menteeEmail,
            String menteeName,
            String bookingId,
            String roomId,
            String courseCode,
            String courseName,
            String mentorName,
            String formatStr,
            Instant startAt,
            int durationMin,
            long price
    ) {
        if (menteeEmail == null || menteeEmail.isBlank()) {
            log.warn("Cannot send booking confirmation: mentee email is empty for booking #{}", bookingId);
            return;
        }

        // Format detailed time in Vietnam Zone (Asia/Ho_Chi_Minh - GMT+7)
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime startVn = startAt.atZone(vnZone);
        ZonedDateTime endVn = startAt.plus(Duration.ofMinutes(durationMin)).atZone(vnZone);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, 'ngày' dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));

        String rawDate = startVn.format(dateFormatter);
        String dateStr = rawDate;
        if (rawDate != null && !rawDate.isEmpty()) {
            dateStr = Character.toUpperCase(rawDate.charAt(0)) + rawDate.substring(1);
        }
        String timeRangeStr = startVn.format(timeFormatter) + " - " + endVn.format(timeFormatter) + " (Giờ Việt Nam - GMT+7)";

        NumberFormat currencyFormat = NumberFormat.getInstance(new Locale("vi", "VN"));
        String formattedPrice = currencyFormat.format(price);

        String effectiveRoom = (roomId != null && !roomId.isBlank()) ? roomId : ("DynForge-" + bookingId);
        String meetingUrl = "https://meet.jit.si/" + effectiveRoom;
        String dashboardUrl = (frontendBaseUrl != null && !frontendBaseUrl.isBlank())
                ? frontendBaseUrl + "/dashboard/sessions"
                : "http://localhost:5173/dashboard/sessions";

        String greetingName = (menteeName != null && !menteeName.isBlank()) ? menteeName : "Bạn";

        if (!isConfigured()) {
            log.info("[Booking Payment Email] (Mail not configured) Booking #{} confirmed for {}: Date={}, Time={}, Course={}, Mentor={}, Price={}",
                    bookingId, menteeEmail, dateStr, timeRangeStr, courseName, mentorName, formattedPrice);
            return;
        }

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="color-scheme" content="light only">
                  <meta name="supported-color-schemes" content="light only">
                  <title>Xác nhận đặt lịch học DynForge</title>
                  <style>
                    :root {
                      color-scheme: light only;
                      supported-color-schemes: light only;
                    }
                    body, table, td, div, p, span, h1, h2 {
                      -webkit-font-smoothing: antialiased;
                    }
                  </style>
                </head>
                <body style="margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;width:100% !important;min-height:100vh;">
                  
                  <!-- Full-width outer wrapper with anti-inversion gradient -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#020b18" style="width:100%;margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);table-layout:fixed;">
                    <tr>
                      <td align="center" bgcolor="#020b18" style="padding:0;margin:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                        
                        <!-- Top Full-Bleed Brand Header -->
                        <div style="width:100%;background:linear-gradient(180deg, #07152d 0%, #020b18 100%);border-bottom:2px solid #06b6d4;padding:40px 20px 32px;text-align:center;box-sizing:border-box;">
                          <h1 style="color:#ffffff;margin:0 0 6px;font-size:28px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
                            Dyn<span style="color:#06b6d4;">Forge</span>
                          </h1>
                          <p style="color:#67e8f9;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
                            Peer-to-Peer Academic Mentorship Platform
                          </p>
                        </div>

                        <!-- Main Content Container (Spacious Full-Page feel, max-width: 880px) with anti-inversion background -->
                        <div style="width:100%;max-width:880px;margin:0 auto;padding:40px 24px;text-align:left;box-sizing:border-box;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                          
                          <!-- Salutation & Status Badge -->
                          <div style="text-align:center;margin-bottom:36px;">
                            <div style="display:inline-block;background-color:#083344;background-image:linear-gradient(180deg, #083344 0%, #083344 100%);color:#38bdf8;padding:8px 20px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid #0284c7;letter-spacing:0.5px;margin-bottom:16px;">
                              ✓ ĐẶT LỊCH & THANH TOÁN KÝ QUỸ THÀNH CÔNG
                            </div>
                            <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                              Thông Báo Xác Nhận Lịch Học
                            </h2>
                            <p style="color:#94a3b8;margin:0 auto;font-size:15px;line-height:1.6;max-width:640px;">
                              Xin chào <strong style="color:#ffffff;">{{GREETING_NAME}}</strong>, lịch học của bạn đã được xác nhận thành công trên hệ thống DynForge. Khoản học phí đã được đưa vào Quỹ Ký Quỹ Escrow an toàn.
                            </p>
                          </div>

                          <!-- 1. Highlight Spotlight: Detailed Session Time -->
                          <div style="background-color:#081b38;background-image:linear-gradient(180deg, #081b38 0%, #081b38 100%);background:linear-gradient(180deg, #081b38 0%, #081b38 100%);border:2px solid #06b6d4;border-radius:20px;padding:32px;margin-bottom:30px;box-shadow:0 0 35px rgba(6,182,212,0.25);">
                            <div style="font-size:12px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              ⏰ THỜI GIAN HỌC CHI TIẾT (GIỜ VIỆT NAM - GMT+7)
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;">
                              <tr>
                                <td style="padding:10px 0;width:30%;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  📅 Ngày học:
                                </td>
                                <td style="padding:10px 0;color:#ffffff;font-size:18px;font-weight:800;vertical-align:middle;">
                                  {{DATE_STR}}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  🕐 Giờ học:
                                </td>
                                <td style="padding:10px 0;vertical-align:middle;">
                                  <span style="display:inline-block;background-color:#083344;background-image:linear-gradient(180deg, #083344 0%, #083344 100%);color:#38bdf8;border:1px solid #0284c7;padding:8px 18px;border-radius:10px;font-size:18px;font-weight:800;letter-spacing:0.5px;">
                                    {{TIME_RANGE_STR}}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  ⏳ Thời lượng:
                                </td>
                                <td style="padding:10px 0;color:#f8fafc;font-size:16px;font-weight:700;vertical-align:middle;">
                                  {{DURATION_MIN}} phút ({{FORMAT_STR}})
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- 2. Session Info Table -->
                          <div style="background-color:#0b152d;background-image:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);background:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);border:1px solid #1e293b;border-radius:20px;padding:28px 32px;margin-bottom:30px;">
                            <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              📋 THÔNG TIN BUỔI HỌC & GIẢNG VIÊN
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;font-size:15px;">
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;width:35%;border-bottom:1px solid #1e293b;">Môn học:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:700;border-bottom:1px solid #1e293b;">{{COURSE_NAME}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Mentor phụ trách:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:700;border-bottom:1px solid #1e293b;">{{MENTOR_NAME}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Hình thức học:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:600;border-bottom:1px solid #1e293b;">{{FORMAT_STR}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Học phí ký quỹ:</td>
                                <td style="padding:10px 0;color:#10b981;font-weight:800;font-size:18px;border-bottom:1px solid #1e293b;">{{FORMATTED_PRICE}} VNĐ</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;">Mã lịch hẹn:</td>
                                <td style="padding:10px 0;color:#38bdf8;font-family:monospace;font-size:14px;font-weight:700;">#{{BOOKING_ID}}</td>
                              </tr>
                            </table>
                          </div>

                          <!-- 3. Primary CTA Button -->
                          <div style="text-align:center;margin:40px 0 36px;">
                            <a href="{{MEETING_URL}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:14px;box-shadow:0 6px 25px rgba(6,182,212,0.45);letter-spacing:0.5px;">
                              🚀 VÀO PHÒNG HỌC TRỰC TUYẾN
                            </a>
                            <div style="margin-top:16px;">
                              <a href="{{DASHBOARD_URL}}" target="_blank" style="color:#38bdf8;font-size:14px;font-weight:600;text-decoration:underline;">
                                Truy cập Bảng điều khiển sinh viên DynForge →
                              </a>
                            </div>
                          </div>

                          <!-- 4. Mentee Refund & Protection Policy -->
                          <div style="background-color:#081b38;background-image:linear-gradient(180deg, #081b38 0%, #051226 100%);background:linear-gradient(180deg, #081b38 0%, #051226 100%);border:1px solid #1e3a8a;border-radius:18px;padding:24px 26px;margin-bottom:28px;box-shadow:0 8px 30px rgba(2,6,23,0.5);">
                            
                            <div style="border-bottom:1px solid #1e293b;padding-bottom:12px;margin-bottom:16px;">
                              <h3 style="color:#38bdf8;font-size:15px;font-weight:800;margin:0;letter-spacing:0.3px;text-transform:uppercase;">
                                🛡️ CHÍNH SÁCH HOÀN TIỀN & BẢO VỆ HỌC VIÊN (MENTEE)
                              </h3>
                              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">
                                Quy định riêng dành cho Học viên theo Chính sách Ký quỹ DynForge Escrow
                              </p>
                            </div>

                            <!-- Escrow Status Notice -->
                            <div style="background:rgba(6,182,212,0.1);border-left:4px solid #06b6d4;border-radius:8px;padding:12px 14px;margin-bottom:16px;">
                              <p style="margin:0;color:#e0f2fe;font-size:13px;line-height:1.6;">
                                🔒 <strong>Học phí được bảo vệ:</strong> Khoản tiền <strong>{{FORMATTED_PRICE}} VNĐ</strong> đang được tạm giữ an toàn trong <strong>Quỹ Ký Quỹ DynForge Escrow</strong>. Tiền chưa chuyển cho Mentor và chỉ được giải ngân khi bạn xác nhận buổi học hoàn thành trọn vẹn.
                              </p>
                            </div>

                            <!-- 2 Columns: Khi nào hoàn vs Khi nào không hoàn -->
                            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                              <tr>
                                <td style="width:50%;vertical-align:top;padding-right:8px;">
                                  <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px;box-sizing:border-box;">
                                    <div style="color:#34d399;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                                      ✅ KHI NÀO BẠN ĐƯỢC HOÀN TIỀN?
                                    </div>
                                    <ul style="margin:0;padding-left:14px;color:#d1fae5;font-size:12px;line-height:1.65;">
                                      <li style="margin-bottom:5px;">
                                        <strong style="color:#ffffff;">Hoàn 100%:</strong> Mentor chủ động hủy lịch học vì bất kỳ lý do nào.
                                      </li>
                                      <li style="margin-bottom:5px;">
                                        <strong style="color:#ffffff;">Hoàn 100%:</strong> Mentor vắng mặt (No-show) hoặc buổi học không diễn ra đúng cam kết.
                                      </li>
                                      <li style="margin-bottom:5px;">
                                        <strong style="color:#ffffff;">Hoàn 100%:</strong> Bạn hủy lịch khi Mentor <em>chưa bấm nhận lớp</em>.
                                      </li>
                                      <li style="margin-bottom:5px;">
                                        <strong style="color:#ffffff;">Hoàn 100%:</strong> Bạn tự hủy lịch <strong>trước giờ học ≥ 24 giờ</strong>.
                                      </li>
                                      <li>
                                        <strong style="color:#fde047;">Hoàn 70%:</strong> Bạn hủy lịch trong khoảng <strong>12 giờ đến 24 giờ</strong> trước giờ học (30% bồi thường thời gian chuẩn bị của Mentor).
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                                <td style="width:50%;vertical-align:top;padding-left:8px;">
                                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:14px;box-sizing:border-box;">
                                    <div style="color:#f87171;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                                      ❌ KHI NÀO KHÔNG ĐƯỢC HOÀN?
                                    </div>
                                    <ul style="margin:0;padding-left:14px;color:#fee2e2;font-size:12px;line-height:1.65;">
                                      <li style="margin-bottom:8px;">
                                        <strong style="color:#ffffff;">Hủy dưới 12 giờ:</strong> Hệ thống <em>khóa tính năng hủy trực tiếp</em> để đảm bảo quyền lợi thời gian của Mentor.
                                      </li>
                                      <li style="margin-bottom:8px;">
                                        <strong style="color:#ffffff;">Học viên vắng mặt:</strong> Tự ý không tham gia phòng học (No-show) mà không báo trước hoặc không có lý do bất khả kháng.
                                      </li>
                                      <li>
                                        <strong style="color:#ffffff;">Đã xác nhận hoàn thành:</strong> Sau khi bạn đã bấm xác nhận hoàn tất buổi học, thù lao đã được chuyển cho Mentor.
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            </table>

                            <!-- Quyền đổi lịch & Khiếu nại -->
                            <div style="background:#0b1329;border:1px solid #1e293b;border-radius:10px;padding:12px 14px;">
                              <div style="color:#fbbf24;font-size:12px;font-weight:700;margin-bottom:4px;">
                                ⚖️ QUYỀN ĐỔI LỊCH & KHIẾU NẠI (DISPUTE):
                              </div>
                              <p style="margin:0 0 4px;color:#cbd5e1;font-size:12px;line-height:1.6;">
                                • <strong>Đổi lịch học:</strong> Bạn được yêu cầu đổi lịch tối đa <strong>2 lần</strong> trước giờ học (hoàn toàn miễn phí).
                              </p>
                              <p style="margin:0;color:#cbd5e1;font-size:12px;line-height:1.6;">
                                • <strong>Mở Khiếu Nại (Dispute):</strong> Sau khi buổi học bắt đầu <strong>15 phút</strong> (nếu Mentor không vào) hoặc trong vòng <strong>24 giờ</strong> sau buổi học, bạn có quyền mở Khiếu nại. Quỹ Escrow sẽ lập tức phong tỏa để Ban Quản Trị đối soát và hoàn tiền.
                              </p>
                            </div>

                          </div>

                          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                            * Vui lòng có mặt trong phòng học trước giờ bắt đầu 5 phút để kiểm tra camera, micro và đường truyền internet.
                          </p>

                        </div>

                        <!-- Full-Bleed Footer -->
                        <div style="width:100%;background-color:#010712;background-image:linear-gradient(180deg, #010712 0%, #010712 100%);background:linear-gradient(180deg, #010712 0%, #010712 100%);border-top:1px solid #1e293b;padding:36px 20px;text-align:center;box-sizing:border-box;">
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#94a3b8;">
                            DynForge Platform — Build People. Forge Futures.
                          </p>
                          <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                            Email tự động gửi từ hệ thống DynForge đến hộp thư của bạn. Vui lòng không phản hồi trực tiếp vào địa chỉ này.
                          </p>
                          <p style="margin:0;font-size:12px;color:#475569;">
                            © 2026 DynForge. Mọi quyền được bảo lưu.
                          </p>
                        </div>

                      </td>
                    </tr>
                  </table>

                </body>
                </html>
                """
                .replace("{{GREETING_NAME}}", greetingName)
                .replace("{{DATE_STR}}", dateStr)
                .replace("{{TIME_RANGE_STR}}", timeRangeStr)
                .replace("{{DURATION_MIN}}", String.valueOf(durationMin))
                .replace("{{COURSE_NAME}}", courseName)
                .replace("{{MENTOR_NAME}}", mentorName)
                .replace("{{FORMAT_STR}}", formatStr)
                .replace("{{FORMATTED_PRICE}}", formattedPrice)
                .replace("{{BOOKING_ID}}", bookingId)
                .replace("{{MEETING_URL}}", meetingUrl)
                .replace("{{DASHBOARD_URL}}", dashboardUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : username;
            helper.setFrom(sender, senderName);
            helper.setTo(menteeEmail);
            helper.setSubject("[DynForge] Xác nhận đặt lịch & thanh toán thành công - Môn " + courseCode);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Booking payment confirmation email sent successfully to {} for booking #{}", menteeEmail, bookingId);
        } catch (Exception e) {
            log.error("Failed to send booking payment confirmation email to {}: {}", menteeEmail, e.getMessage());
        }
    }

    @Async
    public void sendBookingPaymentSuccessEmail(
            String menteeEmail,
            String menteeName,
            String bookingId,
            String courseCode,
            String courseName,
            String mentorName,
            String formatStr,
            Instant startAt,
            int durationMin,
            long price
    ) {
        sendBookingPaymentSuccessEmail(menteeEmail, menteeName, bookingId, null, courseCode, courseName, mentorName, formatStr, startAt, durationMin, price);
    }

    /**
     * Gửi email thông báo cho Mentor khi có Mentee đặt lịch học và thanh toán ký quỹ thành công.
     * Chạy bất đồng bộ (@Async) song song với email của Mentee.
     */
    @Async
    public void sendMentorNewBookingEmail(
            String mentorEmail,
            String mentorName,
            String menteeName,
            String menteeEmail,
            String bookingId,
            String roomId,
            String courseCode,
            String courseName,
            String formatStr,
            Instant startAt,
            int durationMin,
            long earningsAmount
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) {
            log.warn("Cannot send mentor booking notification: mentor email is empty for booking #{}", bookingId);
            return;
        }

        // Format detailed time in Vietnam Zone (Asia/Ho_Chi_Minh - GMT+7)
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime startVn = startAt.atZone(vnZone);
        ZonedDateTime endVn = startAt.plus(Duration.ofMinutes(durationMin)).atZone(vnZone);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, 'ngày' dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));

        String rawDate = startVn.format(dateFormatter);
        String dateStr = rawDate;
        if (rawDate != null && !rawDate.isEmpty()) {
            dateStr = Character.toUpperCase(rawDate.charAt(0)) + rawDate.substring(1);
        }
        String timeRangeStr = startVn.format(timeFormatter) + " - " + endVn.format(timeFormatter) + " (Giờ Việt Nam - GMT+7)";

        NumberFormat currencyFormat = NumberFormat.getInstance(new Locale("vi", "VN"));
        String formattedPrice = currencyFormat.format(earningsAmount);

        String effectiveRoom = (roomId != null && !roomId.isBlank()) ? roomId : ("DynForge-" + bookingId);
        String meetingUrl = "https://meet.jit.si/" + effectiveRoom;
        String dashboardUrl = (frontendBaseUrl != null && !frontendBaseUrl.isBlank())
                ? frontendBaseUrl + "/mentor/dashboard"
                : "http://localhost:5173/mentor/dashboard";

        String greetingMentor = (mentorName != null && !mentorName.isBlank()) ? mentorName : "Giảng viên";
        String studentName = (menteeName != null && !menteeName.isBlank()) ? menteeName : "Học viên";
        String studentMailDisplay = (menteeEmail != null && !menteeEmail.isBlank()) ? menteeEmail : "Đã bảo mật qua hệ thống";

        if (!isConfigured()) {
            log.info("[Mentor Booking Email] (Mail not configured) Booking #{} notification for mentor {}: Mentee={}, Date={}, Time={}, Course={}, Price={}",
                    bookingId, mentorEmail, studentName, dateStr, timeRangeStr, courseName, formattedPrice);
            return;
        }

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="color-scheme" content="light only">
                  <meta name="supported-color-schemes" content="light only">
                  <title>Thông báo lịch dạy mới - DynForge</title>
                  <style>
                    :root {
                      color-scheme: light only;
                      supported-color-schemes: light only;
                    }
                    body, table, td, div, p, span, h1, h2 {
                      -webkit-font-smoothing: antialiased;
                    }
                  </style>
                </head>
                <body style="margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;width:100% !important;min-height:100vh;">
                  
                  <!-- Full-width outer wrapper with anti-inversion gradient -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#020b18" style="width:100%;margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);table-layout:fixed;">
                    <tr>
                      <td align="center" bgcolor="#020b18" style="padding:0;margin:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                        
                        <!-- Top Full-Bleed Brand Header -->
                        <div style="width:100%;background:linear-gradient(180deg, #07152d 0%, #020b18 100%);border-bottom:2px solid #10b981;padding:40px 20px 32px;text-align:center;box-sizing:border-box;">
                          <h1 style="color:#ffffff;margin:0 0 6px;font-size:28px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
                            Dyn<span style="color:#10b981;">Forge</span>
                          </h1>
                          <p style="color:#6ee7b7;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
                            Cổng Quản Lý Giảng Viên & Cố Vấn Học Thuật
                          </p>
                        </div>

                        <!-- Main Content Container (880px Spacious Cockpit View) with anti-inversion background -->
                        <div style="width:100%;max-width:880px;margin:0 auto;padding:40px 24px;text-align:left;box-sizing:border-box;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                          
                          <!-- Salutation & Status Badge -->
                          <div style="text-align:center;margin-bottom:36px;">
                            <div style="display:inline-block;background-color:#064e3b;background-image:linear-gradient(180deg, #064e3b 0%, #064e3b 100%);color:#6ee7b7;padding:8px 22px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid #059669;letter-spacing:0.5px;margin-bottom:16px;">
                              ✨ BẠN CÓ LỊCH DẠY MỚI · HỌC PHÍ ĐÃ KÝ QUỸ
                            </div>
                            <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                              Thông Báo Đặt Lịch Dạy Học Viên
                            </h2>
                            <p style="color:#94a3b8;margin:0 auto;font-size:15px;line-height:1.6;max-width:640px;">
                              Xin chào <strong style="color:#ffffff;">{{MENTOR_NAME}}</strong>, học viên <strong style="color:#38bdf8;">{{MENTEE_NAME}}</strong> vừa hoàn tất thanh toán và đặt lịch học với bạn. Học phí đã được lưu ký an toàn trong Quỹ Ký Quỹ Escrow.
                            </p>
                          </div>

                          <!-- 1. Highlight Spotlight: Detailed Session Time -->
                          <div style="background-color:#081b38;background-image:linear-gradient(180deg, #081b38 0%, #081b38 100%);background:linear-gradient(180deg, #081b38 0%, #081b38 100%);border:2px solid #10b981;border-radius:20px;padding:32px;margin-bottom:30px;box-shadow:0 0 35px rgba(16,185,129,0.2);">
                            <div style="font-size:12px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              ⏰ THỜI GIAN BUỔI DẠY CHI TIẾT (GIỜ VIỆT NAM - GMT+7)
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;">
                              <tr>
                                <td style="padding:10px 0;width:30%;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  📅 Ngày dạy:
                                </td>
                                <td style="padding:10px 0;color:#ffffff;font-size:18px;font-weight:800;vertical-align:middle;">
                                  {{DATE_STR}}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  🕐 Khung giờ:
                                </td>
                                <td style="padding:10px 0;vertical-align:middle;">
                                  <span style="display:inline-block;background-color:#064e3b;background-image:linear-gradient(180deg, #064e3b 0%, #064e3b 100%);color:#6ee7b7;border:1px solid #059669;padding:8px 18px;border-radius:10px;font-size:18px;font-weight:800;letter-spacing:0.5px;">
                                    {{TIME_RANGE_STR}}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;font-size:15px;font-weight:600;vertical-align:middle;">
                                  ⏳ Thời lượng:
                                </td>
                                <td style="padding:10px 0;color:#f8fafc;font-size:16px;font-weight:700;vertical-align:middle;">
                                  {{DURATION_MIN}} phút ({{FORMAT_STR}})
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- 2. Mentee & Booking Info Table -->
                          <div style="background-color:#0b152d;background-image:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);background:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);border:1px solid #1e293b;border-radius:20px;padding:28px 32px;margin-bottom:30px;">
                            <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              📋 THÔNG TIN HỌC VIÊN & THÙ LAO KÝ QUỸ
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;font-size:15px;">
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;width:35%;border-bottom:1px solid #1e293b;">Học viên:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:700;border-bottom:1px solid #1e293b;">{{MENTEE_NAME}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Email học viên:</td>
                                <td style="padding:10px 0;color:#38bdf8;font-weight:600;border-bottom:1px solid #1e293b;">{{MENTEE_EMAIL}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Môn học:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:700;border-bottom:1px solid #1e293b;">{{COURSE_NAME}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Hình thức:</td>
                                <td style="padding:10px 0;color:#ffffff;font-weight:600;border-bottom:1px solid #1e293b;">{{FORMAT_STR}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Thù lao giảng dạy:</td>
                                <td style="padding:10px 0;color:#10b981;font-weight:800;font-size:18px;border-bottom:1px solid #1e293b;">
                                  {{FORMATTED_PRICE}} VNĐ 
                                  <span style="font-size:12px;font-weight:600;color:#6ee7b7;margin-left:6px;">(Đã lưu ký trong quỹ Escrow)</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;">Mã lịch hẹn:</td>
                                <td style="padding:10px 0;color:#38bdf8;font-family:monospace;font-size:14px;font-weight:700;">#{{BOOKING_ID}}</td>
                              </tr>
                            </table>
                          </div>

                          <!-- 3. Primary CTA Button -->
                          <div style="text-align:center;margin:40px 0 36px;">
                            <a href="{{MEETING_URL}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #10b981 0%, #0284c7 100%);color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:14px;box-shadow:0 6px 25px rgba(16,185,129,0.4);letter-spacing:0.5px;">
                              🚀 VÀO PHÒNG HỌC TRỰC TUYẾN
                            </a>
                            <div style="margin-top:16px;">
                              <a href="{{DASHBOARD_URL}}" target="_blank" style="color:#6ee7b7;font-size:14px;font-weight:600;text-decoration:underline;">
                                Quản lý lịch dạy tại Bảng điều khiển Giảng viên →
                              </a>
                            </div>
                          </div>

                          <!-- 4. Mentor Payout, Compensation & Penalty Policy -->
                          <div style="background-color:#041a18;background-image:linear-gradient(180deg, #041a18 0%, #020f0e 100%);background:linear-gradient(180deg, #041a18 0%, #020f0e 100%);border:1px solid #065f46;border-radius:18px;padding:24px 26px;margin-bottom:28px;box-shadow:0 8px 30px rgba(2,6,23,0.5);">
                            
                            <div style="border-bottom:1px solid #064e3b;padding-bottom:12px;margin-bottom:16px;">
                              <h3 style="color:#6ee7b7;font-size:15px;font-weight:800;margin:0;letter-spacing:0.3px;text-transform:uppercase;">
                                💼 CHÍNH SÁCH THÙ LAO & CAM KẾT DÀNH CHO MENTOR
                              </h3>
                              <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">
                                Quy định riêng dành cho Giảng viên theo Chính sách Ký quỹ DynForge Escrow
                              </p>
                            </div>

                            <!-- Escrow Payout Notice -->
                            <div style="background:rgba(16,185,129,0.1);border-left:4px solid #10b981;border-radius:8px;padding:12px 14px;margin-bottom:16px;">
                              <p style="margin:0;color:#d1fae5;font-size:13px;line-height:1.6;">
                                💰 <strong>Thù lao đảm bảo trong Quỹ Escrow:</strong> Học viên đã thanh toán vào Quỹ Ký Quỹ. Thù lao của bạn được tính bằng <strong>85% học phí</strong> (DynForge giữ 15% hoa hồng vận hành phòng học trực tuyến và bảo vệ giao dịch).
                              </p>
                            </div>

                            <!-- 2 Columns: Khi nào nhận tiền/bồi thường vs Khi nào không được nhận/bị phạt -->
                            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                              <tr>
                                <td style="width:50%;vertical-align:top;padding-right:8px;">
                                  <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px;box-sizing:border-box;">
                                    <div style="color:#34d399;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                                      💵 KHI NÀO MENTOR NHẬN ĐƯỢC TIỀN?
                                    </div>
                                    <ul style="margin:0;padding-left:14px;color:#d1fae5;font-size:12px;line-height:1.65;">
                                      <li style="margin-bottom:6px;">
                                        <strong style="color:#ffffff;">Giải ngân tức thì:</strong> Khi học viên bấm <em>"Xác nhận hoàn thành"</em> sau buổi học, thù lao chuyển ngay vào ví của bạn.
                                      </li>
                                      <li style="margin-bottom:6px;">
                                        <strong style="color:#ffffff;">Tự động giải ngân sau 24h:</strong> Sau khi bạn đánh dấu <em>"Đã dạy xong"</em>, nếu học viên không khiếu nại trong 24h, tiền tự động vào ví.
                                      </li>
                                      <li>
                                        <strong style="color:#fde047;">Được bồi thường 30%:</strong> Nếu học viên hủy lịch trong khoảng <strong>12h - 24h</strong> trước giờ học, bạn nhận 30% học phí bồi thường (sau khi trừ 15% hoa hồng) vào ví để bù đắp thời gian đã giữ lịch.
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                                <td style="width:50%;vertical-align:top;padding-left:8px;">
                                  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:14px;box-sizing:border-box;">
                                    <div style="color:#f87171;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
                                      ⚠️ KHÔNG ĐƯỢC NHẬN TIỀN & XỬ PHẠT
                                    </div>
                                    <ul style="margin:0;padding-left:14px;color:#fee2e2;font-size:12px;line-height:1.65;">
                                      <li style="margin-bottom:8px;">
                                        <strong style="color:#ffffff;">Mentor tự ý hủy lịch:</strong> Bạn <em>không nhận được tiền</em>, 100% học phí hoàn trả cho học viên. Đồng thời tài khoản bị ghi nhận <strong>+1 lần hủy lịch</strong>, làm giảm uy tín và thứ hạng hiển thị.
                                      </li>
                                      <li style="margin-bottom:8px;">
                                        <strong style="color:#ffffff;">Vắng mặt (No-show):</strong> Không vào phòng dạy hoặc vào trễ quá 15 phút không báo trước, học viên có quyền khiếu nại và nhận hoàn 100% tiền.
                                      </li>
                                      <li>
                                        <strong style="color:#ffffff;">Dạy sai môn / không đúng cam kết:</strong> Nếu học viên khiếu nại thành công, thù lao sẽ bị hủy bỏ hoàn trả cho học viên.
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            </table>

                            <!-- Quyền giải trình & Đối soát -->
                            <div style="background:#021714;border:1px solid #065f46;border-radius:10px;padding:12px 14px;">
                              <div style="color:#6ee7b7;font-size:12px;font-weight:700;margin-bottom:4px;">
                                🛡️ QUYỀN GIẢI TRÌNH & ĐỐI SOÁT KHIẾU NẠI:
                              </div>
                              <p style="margin:0 0 4px;color:#a7f3d0;font-size:12px;line-height:1.6;">
                                • Nếu học viên mở khiếu nại, bạn có quyền gửi giải trình và cung cấp bằng chứng (ảnh chụp màn hình, nhật ký phòng học) trực tiếp trên Bảng điều khiển Mentor.
                              </p>
                              <p style="margin:0;color:#a7f3d0;font-size:12px;line-height:1.6;">
                                • Ban Trọng tài DynForge sẽ đối soát khách quan dữ liệu phòng học (telemetry) để bảo vệ tối đa quyền lợi và công sức giảng dạy của bạn.
                              </p>
                            </div>

                          </div>

                          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                            * Email này là thông báo tự động từ hệ thống DynForge xác nhận lịch dạy chính thức của bạn.
                          </p>

                        </div>

                        <!-- Full-Bleed Footer -->
                        <div style="width:100%;background-color:#010712;background-image:linear-gradient(180deg, #010712 0%, #010712 100%);background:linear-gradient(180deg, #010712 0%, #010712 100%);border-top:1px solid #1e293b;padding:36px 20px;text-align:center;box-sizing:border-box;">
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#94a3b8;">
                            DynForge Platform — Build People. Forge Futures.
                          </p>
                          <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                            Cổng thông tin giảng viên và cố vấn học thuật DynForge. Vui lòng không trả lời thư này.
                          </p>
                          <p style="margin:0;font-size:12px;color:#475569;">
                            © 2026 DynForge. Mọi quyền được bảo lưu.
                          </p>
                        </div>

                      </td>
                    </tr>
                  </table>

                </body>
                </html>
                """
                .replace("{{MENTOR_NAME}}", greetingMentor)
                .replace("{{MENTEE_NAME}}", studentName)
                .replace("{{MENTEE_EMAIL}}", studentMailDisplay)
                .replace("{{DATE_STR}}", dateStr)
                .replace("{{TIME_RANGE_STR}}", timeRangeStr)
                .replace("{{DURATION_MIN}}", String.valueOf(durationMin))
                .replace("{{COURSE_NAME}}", courseName)
                .replace("{{FORMAT_STR}}", formatStr)
                .replace("{{FORMATTED_PRICE}}", formattedPrice)
                .replace("{{BOOKING_ID}}", bookingId)
                .replace("{{MEETING_URL}}", meetingUrl)
                .replace("{{DASHBOARD_URL}}", dashboardUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : username;
            helper.setFrom(sender, senderName);
            helper.setTo(mentorEmail);
            helper.setSubject("[DynForge] Bạn có lịch dạy mới từ học viên " + studentName + " - Môn " + courseCode);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Mentor booking notification email sent successfully to {} for booking #{}", mentorEmail, bookingId);
        } catch (Exception e) {
            log.error("Failed to send mentor booking notification email to {}: {}", mentorEmail, e.getMessage());
        }
    }

    @Async
    public void sendMentorNewBookingEmail(
            String mentorEmail,
            String mentorName,
            String menteeName,
            String menteeEmail,
            String bookingId,
            String courseCode,
            String courseName,
            String formatStr,
            Instant startAt,
            int durationMin,
            long earningsAmount
    ) {
        sendMentorNewBookingEmail(mentorEmail, mentorName, menteeName, menteeEmail, bookingId, null, courseCode, courseName, formatStr, startAt, durationMin, earningsAmount);
    }

    private String formatVnDateTimeRange(Instant startAt, int durationMin) {
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime startVn = startAt.atZone(vnZone);
        ZonedDateTime endVn = startAt.plus(Duration.ofMinutes(durationMin)).atZone(vnZone);
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, 'ngày' dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));
        String dateStr = startVn.format(dateFormatter);
        if (!dateStr.isEmpty()) {
            dateStr = Character.toUpperCase(dateStr.charAt(0)) + dateStr.substring(1);
        }
        return dateStr + " | " + startVn.format(timeFormatter) + " - " + endVn.format(timeFormatter) + " (GMT+7)";
    }

    @Async
    public void sendRescheduleNotificationToMentor(
            String mentorEmail,
            String mentorName,
            String menteeName,
            String bookingId,
            String roomId,
            String courseCode,
            Instant oldStartAt,
            Instant newStartAt,
            int durationMin
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) return;

        String oldTimeStr = formatVnDateTimeRange(oldStartAt, durationMin);
        String newTimeStr = formatVnDateTimeRange(newStartAt, durationMin);
        String effectiveRoom = (roomId != null && !roomId.isBlank()) ? roomId : ("DynForge-" + bookingId);
        String meetingUrl = "https://meet.jit.si/" + effectiveRoom;

        if (!isConfigured()) {
            log.info("[Reschedule Notice] (Mail not configured) Booking #{} rescheduled by {}. Old: {}, New: {}",
                    bookingId, menteeName, oldTimeStr, newTimeStr);
            return;
        }

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#06b6d4;margin:0 0 12px">DynForge - Thông Báo Cập Nhật Lịch Học</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Học viên <b>%s</b> đã đổi lịch buổi học môn <b>%s</b> (Booking #%s).</p>
                  <div style="background:#081b38;border:1px solid #06b6d4;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0;color:#94a3b8">Lịch học cũ: <span style="text-decoration:line-through;color:#ef4444">%s</span></p>
                    <p style="margin:4px 0;color:#38bdf8;font-size:16px;font-weight:700">Lịch học mới: %s</p>
                    <p style="margin:4px 0;color:#cbd5e1">Thời lượng: %d phút</p>
                  </div>
                  <p>Phòng học trực tuyến: <a href="%s" style="color:#06b6d4;font-weight:700">%s</a></p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                mentorName != null ? mentorName : "Mentor",
                menteeName != null ? menteeName : "Học viên",
                courseCode, bookingId,
                oldTimeStr, newTimeStr, durationMin, meetingUrl, meetingUrl
        );

        sendEmailDirect(mentorEmail, "[DynForge] Học viên đã đổi lịch buổi học môn " + courseCode, html);
    }

    @Async
    public void sendRescheduleNotificationToMentor(
            String mentorEmail,
            String mentorName,
            String menteeName,
            String bookingId,
            String courseCode,
            Instant oldStartAt,
            Instant newStartAt,
            int durationMin
    ) {
        sendRescheduleNotificationToMentor(mentorEmail, mentorName, menteeName, bookingId, null, courseCode, oldStartAt, newStartAt, durationMin);
    }

    @Async
    public void sendRescheduleRequestToMentor(
            String mentorEmail,
            String mentorName,
            String menteeName,
            String bookingId,
            String courseCode,
            Instant oldStartAt,
            Instant pendingStartAt,
            int durationMin
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) return;

        String oldTimeStr = formatVnDateTimeRange(oldStartAt, durationMin);
        String pendingTimeStr = formatVnDateTimeRange(pendingStartAt, durationMin);
        String sessionsUrl = (frontendBaseUrl != null ? frontendBaseUrl : "http://localhost:5173") + "/mentor/sessions";

        if (!isConfigured()) {
            log.info("[Reschedule Request] (Mail not configured) Booking #{} reschedule request from {}. Old: {}, Pending: {}",
                    bookingId, menteeName, oldTimeStr, pendingTimeStr);
            return;
        }

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#eab308;margin:0 0 12px">DynForge - Yêu Cầu Đổi Lịch Học Chờ Phê Duyệt</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Học viên <b>%s</b> đã gửi yêu cầu đổi lịch buổi học môn <b>%s</b> (Booking #%s) trong khung thời gian 12h - 24h trước buổi học.</p>
                  <div style="background:#081b38;border:1px solid #eab308;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0;color:#94a3b8">Lịch học hiện tại: %s</p>
                    <p style="margin:4px 0;color:#facc15;font-size:16px;font-weight:700">Khung giờ đề xuất mới: %s</p>
                    <p style="margin:4px 0;color:#cbd5e1">Thời lượng: %d phút</p>
                  </div>
                  <p>Vui lòng đăng nhập vào trang quản lý lịch dạy để Đồng ý hoặc Từ chối yêu cầu đổi lịch này:</p>
                  <p><a href="%s" style="display:inline-block;background:#eab308;color:#000;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">Xem & Phản Hồi Trên Hệ Thống</a></p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                mentorName != null ? mentorName : "Mentor",
                menteeName != null ? menteeName : "Học viên",
                courseCode, bookingId,
                oldTimeStr, pendingTimeStr, durationMin, sessionsUrl
        );

        sendEmailDirect(mentorEmail, "[DynForge] Yêu cầu đổi lịch học môn " + courseCode + " từ " + (menteeName != null ? menteeName : "học viên"), html);
    }

    @Async
    public void sendRescheduleResponseToMentee(
            String menteeEmail,
            String menteeName,
            String mentorName,
            String bookingId,
            String courseCode,
            boolean accepted,
            Instant originalStartAt,
            Instant newStartAt,
            int durationMin
    ) {
        if (menteeEmail == null || menteeEmail.isBlank()) return;

        String formattedTimeStr = formatVnDateTimeRange(newStartAt, durationMin);
        String dashboardUrl = (frontendBaseUrl != null ? frontendBaseUrl : "http://localhost:5173") + "/dashboard/sessions";

        if (!isConfigured()) {
            log.info("[Reschedule Response] (Mail not configured) Booking #{}: Mentor {} {} reschedule. Time: {}",
                    bookingId, mentorName, accepted ? "ACCEPTED" : "DECLINED", formattedTimeStr);
            return;
        }

        String html = accepted ? """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#10b981;margin:0 0 12px">DynForge - Yêu Cầu Đổi Lịch Đã Được Chấp Nhận</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Mentor <b>%s</b> đã chấp nhận yêu cầu đổi lịch buổi học môn <b>%s</b> (Booking #%s).</p>
                  <div style="background:#081b38;border:1px solid #10b981;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0;color:#34d399;font-size:16px;font-weight:700">Lịch học mới chính thức: %s</p>
                    <p style="margin:4px 0;color:#cbd5e1">Thời lượng: %d phút</p>
                  </div>
                  <p><a href="%s" style="color:#38bdf8;font-weight:700">Xem chi tiết trên Dashboard</a></p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                menteeName != null ? menteeName : "Học viên",
                mentorName != null ? mentorName : "Mentor",
                courseCode, bookingId,
                formattedTimeStr, durationMin, dashboardUrl
        ) : """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#ef4444;margin:0 0 12px">DynForge - Yêu Cầu Đổi Lịch Bị Từ Chối</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Mentor <b>%s</b> không thể sắp xếp khung giờ mới và đã từ chối yêu cầu đổi lịch môn <b>%s</b> (Booking #%s).</p>
                  <div style="background:#081b38;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0;color:#f87171">Lịch học vẫn giữ nguyên mốc cũ:</p>
                    <p style="margin:4px 0;color:#f8fafc;font-size:16px;font-weight:700">%s</p>
                  </div>
                  <p><a href="%s" style="color:#38bdf8;font-weight:700">Xem chi tiết trên Dashboard</a></p>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                menteeName != null ? menteeName : "Học viên",
                mentorName != null ? mentorName : "Mentor",
                courseCode, bookingId,
                formattedTimeStr, dashboardUrl
        );

        String subject = accepted
                ? "[DynForge] Mentor đã chấp nhận yêu cầu đổi lịch môn " + courseCode
                : "[DynForge] Mentor đã từ chối yêu cầu đổi lịch môn " + courseCode;

        sendEmailDirect(menteeEmail, subject, html);
    }

    @Async
    public void sendCancellationNotification(
            String recipientEmail,
            String recipientName,
            String actorName,
            String bookingId,
            String courseCode,
            String refundDetail
    ) {
        if (recipientEmail == null || recipientEmail.isBlank()) return;

        if (!isConfigured()) {
            log.info("[Cancellation Notice] (Mail not configured) Booking #{} cancelled by {}. Details: {}",
                    bookingId, actorName, refundDetail);
            return;
        }

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#ef4444;margin:0 0 12px">DynForge - Thông Báo Hủy Buổi Học</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Buổi học môn <b>%s</b> (Booking #%s) đã được hủy bởi <b>%s</b>.</p>
                  <div style="background:#081b38;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0">
                    <p style="margin:4px 0;color:#cbd5e1">Thông tin chi tiết: <b>%s</b></p>
                  </div>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                recipientName != null ? recipientName : "Bạn",
                courseCode, bookingId,
                actorName != null ? actorName : "Hệ thống",
                refundDetail
        );

        sendEmailDirect(recipientEmail, "[DynForge] Thông báo hủy buổi học môn " + courseCode, html);
    }

    @Async
    public void sendMentorMarkTaughtReminder(
            String mentorEmail,
            String mentorName,
            String bookingId,
            String courseCode,
            int hoursElapsed
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) return;

        if (!isConfigured()) {
            log.info("[Mark-Taught Reminder] (Mail not configured) Booking #{} course {} past {}h for mentor {}",
                    bookingId, courseCode, hoursElapsed, mentorEmail);
            return;
        }

        String warningBox = hoursElapsed >= 12
                ? """
                  <div style="background:#450a0a;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;color:#fecaca">
                    <p style="margin:0;font-weight:bold">CẢNH BÁO QUAN TRỌNG:</p>
                    <p style="margin:4px 0">Buổi học đã kết thúc được 12 tiếng. Nếu bạn không bấm xác nhận trước mốc 24 tiếng sau khi buổi học kết thúc, hệ thống sẽ tự động coi là No-show (vắng mặt) và hoàn tiền 100%% cho học viên!</p>
                  </div>
                  """
                : """
                  <div style="background:#081b38;border:1px solid #38bdf8;border-radius:8px;padding:16px;margin:16px 0;color:#e0f2fe">
                    <p style="margin:0">Vui lòng truy cập trang cá nhân của bạn để bấm <b>Xác nhận đã dạy (Mark Taught)</b> để hoàn tất buổi học và mở khóa tiền thù lao ký quỹ.</p>
                  </div>
                  """;

        String subject = hoursElapsed >= 12
                ? "[DynForge - CẢNH BÁO] Xác nhận buổi dạy môn " + courseCode + " trước mốc 24h (No-show)"
                : "[DynForge] Nhắc nhở: Xác nhận đã dạy buổi học môn " + courseCode;

        String sessionUrl = frontendBaseUrl + "/mentor/sessions";

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#38bdf8;margin:0 0 12px">DynForge - Nhắc Nhở Xác Nhận Buổi Học</h2>
                  <p>Xin chào Mentor <b>%s</b>,</p>
                  <p>Buổi dạy môn <b>%s</b> (Mã booking: <b>#%s</b>) đã kết thúc được khoảng <b>%d tiếng</b>, nhưng hệ thống ghi nhận bạn chưa bấm xác nhận hoàn tất buổi dạy.</p>
                  %s
                  <div style="text-align:center;margin:24px 0">
                    <a href="%s" style="background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Đến Danh Sách Buổi Dạy</a>
                  </div>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(
                mentorName != null ? mentorName : "Mentor",
                courseCode, bookingId, hoursElapsed,
                warningBox,
                sessionUrl
        );

        sendEmailDirect(mentorEmail, subject, html);
    }

    /**
     * Sends an automated email to a mentor when their verification application is approved by admin,
     * confirming their official mentor status, course approval, and next steps.
     */
    @Async
    public void sendMentorApprovalSuccessEmail(
            String mentorEmail,
            String mentorName,
            String courseCode,
            String claimedGrade,
            String adminNote
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) {
            log.warn("Cannot send mentor approval email: mentor email is empty");
            return;
        }

        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        ZonedDateTime nowVn = ZonedDateTime.now(vnZone);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm - EEEE, 'ngày' dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
        String rawApprovedAt = nowVn.format(formatter);
        String approvedAtStr = rawApprovedAt;
        if (rawApprovedAt != null && !rawApprovedAt.isEmpty()) {
            approvedAtStr = Character.toUpperCase(rawApprovedAt.charAt(0)) + rawApprovedAt.substring(1);
        }

        String greetingMentor = (mentorName != null && !mentorName.isBlank()) ? mentorName : "Giảng viên";
        String effectiveCourse = (courseCode != null && !courseCode.isBlank()) ? courseCode : "Chuyên môn học thuật";
        String effectiveGrade = (claimedGrade != null && !claimedGrade.isBlank()) ? claimedGrade : "Đạt chuẩn";
        String effectiveNote = (adminNote != null && !adminNote.isBlank())
                ? adminNote
                : "Hồ sơ và chứng chỉ của bạn đã được kiểm tra tính hợp lệ và đáp ứng đầy đủ tiêu chuẩn giảng dạy của DynForge.";

        String dashboardUrl = (frontendBaseUrl != null && !frontendBaseUrl.isBlank())
                ? frontendBaseUrl + "/mentor/dashboard"
                : "http://localhost:5173/mentor/dashboard";
        String availabilityUrl = (frontendBaseUrl != null && !frontendBaseUrl.isBlank())
                ? frontendBaseUrl + "/mentor/availability"
                : "http://localhost:5173/mentor/availability";
        String profileUrl = (frontendBaseUrl != null && !frontendBaseUrl.isBlank())
                ? frontendBaseUrl + "/mentor/profile"
                : "http://localhost:5173/mentor/profile";

        if (!isConfigured()) {
            log.info("[Mentor Approval Email] (Mail not configured) Mentor {} ({}) approved for course {} with grade {}",
                    greetingMentor, mentorEmail, effectiveCourse, effectiveGrade);
            return;
        }

        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta name="color-scheme" content="light only">
                  <meta name="supported-color-schemes" content="light only">
                  <title>Chúc mừng! Bạn đã trở thành Mentor chính thức của DynForge</title>
                  <style>
                    :root {
                      color-scheme: light only;
                      supported-color-schemes: light only;
                    }
                    body, table, td, div, p, span, h1, h2 {
                      -webkit-font-smoothing: antialiased;
                    }
                  </style>
                </head>
                <body style="margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;width:100% !important;min-height:100vh;">
                  
                  <!-- Full-width outer wrapper with anti-inversion gradient -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#020b18" style="width:100%;margin:0;padding:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);table-layout:fixed;">
                    <tr>
                      <td align="center" bgcolor="#020b18" style="padding:0;margin:0;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                        
                        <!-- Top Full-Bleed Brand Header -->
                        <div style="width:100%;background:linear-gradient(180deg, #07152d 0%, #020b18 100%);border-bottom:2px solid #10b981;padding:40px 20px 32px;text-align:center;box-sizing:border-box;">
                          <h1 style="color:#ffffff;margin:0 0 6px;font-size:28px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">
                            Dyn<span style="color:#10b981;">Forge</span>
                          </h1>
                          <p style="color:#6ee7b7;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
                            Cổng Quản Lý Giảng Viên & Cố Vấn Học Thuật
                          </p>
                        </div>

                        <!-- Main Content Container (880px Spacious Cockpit View) with anti-inversion background -->
                        <div style="width:100%;max-width:880px;margin:0 auto;padding:40px 24px;text-align:left;box-sizing:border-box;background-color:#020b18;background-image:linear-gradient(180deg, #020b18 0%, #020b18 100%);background:linear-gradient(180deg, #020b18 0%, #020b18 100%);">
                          
                          <!-- Salutation & Status Badge -->
                          <div style="text-align:center;margin-bottom:36px;">
                            <div style="display:inline-block;background-color:#064e3b;background-image:linear-gradient(180deg, #064e3b 0%, #064e3b 100%);color:#6ee7b7;padding:8px 24px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid #059669;letter-spacing:0.5px;margin-bottom:16px;">
                              🎉 HỒ SƠ ĐÃ ĐƯỢC DUYỆT CHÍNH THỨC
                            </div>
                            <h2 style="color:#ffffff;margin:0 0 10px;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                              Chúc Mừng! Bạn Đã Trở Thành Mentor DynForge
                            </h2>
                            <p style="color:#94a3b8;margin:0 auto;font-size:15px;line-height:1.6;max-width:640px;">
                              Xin chào <strong style="color:#ffffff;">{{MENTOR_NAME}}</strong>, hồ sơ đăng ký trở thành Mentor của bạn cho môn <strong style="color:#38bdf8;">{{COURSE_CODE}}</strong> đã được Ban Quản Trị DynForge phê duyệt thành công. Tài khoản của bạn hiện đã được kích hoạt đầy đủ quyền hạn Mentor chính thức!
                            </p>
                          </div>

                          <!-- 1. Highlight Spotlight: Verification & Approved Course Details -->
                          <div style="background-color:#081b38;background-image:linear-gradient(180deg, #081b38 0%, #081b38 100%);background:linear-gradient(180deg, #081b38 0%, #081b38 100%);border:2px solid #10b981;border-radius:20px;padding:32px;margin-bottom:30px;box-shadow:0 0 35px rgba(16,185,129,0.25);">
                            <div style="font-size:12px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              🎖️ THÔNG TIN PHÊ DUYỆT CHUYÊN MÔN HỌC THUẬT
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;font-size:15px;">
                              <tr>
                                <td style="padding:10px 0;width:35%;color:#94a3b8;border-bottom:1px solid #1e293b;">Môn học phê chuẩn:</td>
                                <td style="padding:10px 0;color:#ffffff;font-size:18px;font-weight:800;border-bottom:1px solid #1e293b;">
                                  {{COURSE_CODE}}
                                  <span style="display:inline-block;background-color:#064e3b;color:#6ee7b7;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;margin-left:8px;border:1px solid #059669;">
                                    ✓ ĐÃ CHỨNG THỰC
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Điểm số / Xếp loại:</td>
                                <td style="padding:10px 0;color:#38bdf8;font-weight:700;border-bottom:1px solid #1e293b;">{{CLAIMED_GRADE}}</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;border-bottom:1px solid #1e293b;">Thời điểm phê duyệt:</td>
                                <td style="padding:10px 0;color:#f8fafc;font-weight:600;border-bottom:1px solid #1e293b;">{{APPROVED_AT_STR}} (GMT+7)</td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;color:#94a3b8;vertical-align:top;">Ghi chú từ Ban Quản Trị:</td>
                                <td style="padding:10px 0;color:#cbd5e1;line-height:1.6;">{{ADMIN_NOTE}}</td>
                              </tr>
                            </table>
                          </div>

                          <!-- 2. Mentor Privileges Showcase -->
                          <div style="background-color:#0b152d;background-image:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);background:linear-gradient(180deg, #0b152d 0%, #0b152d 100%);border:1px solid #1e293b;border-radius:20px;padding:28px 32px;margin-bottom:30px;">
                            <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:18px;">
                              🌟 ĐẶC QUYỀN MENTOR CHÍNH THỨC DYNFORGE
                            </div>
                            
                            <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
                              <tr>
                                <td style="padding:10px 0;vertical-align:top;width:40px;font-size:20px;">🛡️</td>
                                <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #1e293b;">
                                  <strong style="color:#ffffff;">Huy hiệu Xác thực Uy tín (Verified Badge):</strong>
                                  <div style="color:#94a3b8;margin-top:2px;">Hồ sơ của bạn được gắn biểu tượng chứng thực, giúp gia tăng tối đa niềm tin với sinh viên và được ưu tiên gợi ý trên bảng tìm kiếm.</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;vertical-align:top;width:40px;font-size:20px;">💼</td>
                                <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #1e293b;">
                                  <strong style="color:#ffffff;">Chủ động nguồn thu nhập & Escrow bảo vệ:</strong>
                                  <div style="color:#94a3b8;margin-top:2px;">Tự do cài đặt học phí 1-kèm-1 hoặc nhóm học tập. Tiền được lưu giữ trong Quỹ Ký Quỹ Escrow và giải ngân ngay về ví của bạn khi kết thúc buổi dạy.</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;vertical-align:top;width:40px;font-size:20px;">📅</td>
                                <td style="padding:10px 0;vertical-align:top;border-bottom:1px solid #1e293b;">
                                  <strong style="color:#ffffff;">Linh hoạt thời gian dạy:</strong>
                                  <div style="color:#94a3b8;margin-top:2px;">Chủ động bật/tắt các khung giờ rảnh theo tuần. Mentee chỉ có thể đặt lịch theo thời gian bạn đã thiết lập sẵn.</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:10px 0;vertical-align:top;width:40px;font-size:20px;">🤖</td>
                                <td style="padding:10px 0;vertical-align:top;">
                                  <strong style="color:#ffffff;">Hạ tầng công nghệ toàn diện:</strong>
                                  <div style="color:#94a3b8;margin-top:2px;">Tích hợp sẵn phòng học video trực tuyến, lịch nhắc tự động qua email và trợ lý AI thông minh hỗ trợ giải đáp học thuật.</div>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- 3. Next Steps Guide -->
                          <div style="background-color:#06231c;background-image:linear-gradient(180deg, #06231c 0%, #06231c 100%);background:linear-gradient(180deg, #06231c 0%, #06231c 100%);border-left:4px solid #10b981;border-radius:12px;padding:24px;margin-bottom:32px;">
                            <strong style="color:#6ee7b7;font-size:15px;display:block;margin-bottom:12px;">
                              🚀 3 Bước Tiếp Theo Để Bắt Đầu Nhận Buổi Dạy Đầu Tiên:
                            </strong>
                            <ol style="margin:0;padding-left:20px;color:#d1fae5;font-size:14px;line-height:1.8;">
                              <li><strong>Cập nhật Hồ sơ Mentor:</strong> Thêm tiểu sử (Bio), kinh nghiệm cá nhân, bằng cấp và hình ảnh đại diện tại <a href="{{PROFILE_URL}}" style="color:#38bdf8;text-decoration:underline;">Hồ sơ giảng viên</a>.</li>
                              <li><strong>Thiết lập Lịch rảnh (Availability):</strong> Chọn các khung giờ trong tuần bạn sẵn sàng dạy học tại <a href="{{AVAILABILITY_URL}}" style="color:#38bdf8;text-decoration:underline;">Quản lý lịch rảnh</a>.</li>
                              <li><strong>Sẵn sàng đón học viên:</strong> Khi học viên đặt lịch và thanh toán thành công, bạn sẽ nhận được thông báo tức thì qua email và chuông hệ thống!</li>
                            </ol>
                          </div>

                          <!-- 4. Primary CTA Button -->
                          <div style="text-align:center;margin:40px 0 36px;">
                            <a href="{{DASHBOARD_URL}}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #10b981 0%, #0284c7 100%);color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:18px 48px;border-radius:14px;box-shadow:0 6px 25px rgba(16,185,129,0.4);letter-spacing:0.5px;">
                              🚀 TRUY CẬP BẢNG ĐIỀU KHIỂN MENTOR
                            </a>
                            <div style="margin-top:16px;">
                              <a href="{{AVAILABILITY_URL}}" target="_blank" style="color:#6ee7b7;font-size:14px;font-weight:600;text-decoration:underline;">
                                Cài đặt khung giờ rảnh & biểu phí giảng dạy →
                              </a>
                            </div>
                          </div>

                          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                            * Nếu bạn cần bất kỳ hỗ trợ nào về cách vận hành hoặc chính sách giảng dạy, đừng ngần ngại liên hệ với Ban Hỗ Trợ DynForge.
                          </p>

                        </div>

                        <!-- Full-Bleed Footer -->
                        <div style="width:100%;background-color:#010712;background-image:linear-gradient(180deg, #010712 0%, #010712 100%);background:linear-gradient(180deg, #010712 0%, #010712 100%);border-top:1px solid #1e293b;padding:36px 20px;text-align:center;box-sizing:border-box;">
                          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#94a3b8;">
                            DynForge Platform — Build People. Forge Futures.
                          </p>
                          <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                            Cổng thông tin giảng viên và cố vấn học thuật DynForge. Vui lòng không phản hồi trực tiếp vào địa chỉ này.
                          </p>
                          <p style="margin:0;font-size:12px;color:#475569;">
                            © 2026 DynForge. Mọi quyền được bảo lưu.
                          </p>
                        </div>

                      </td>
                    </tr>
                  </table>

                </body>
                </html>
                """
                .replace("{{MENTOR_NAME}}", greetingMentor)
                .replace("{{COURSE_CODE}}", effectiveCourse)
                .replace("{{CLAIMED_GRADE}}", effectiveGrade)
                .replace("{{APPROVED_AT_STR}}", approvedAtStr)
                .replace("{{ADMIN_NOTE}}", effectiveNote)
                .replace("{{DASHBOARD_URL}}", dashboardUrl)
                .replace("{{PROFILE_URL}}", profileUrl)
                .replace("{{AVAILABILITY_URL}}", availabilityUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : username;
            helper.setFrom(sender, senderName);
            helper.setTo(mentorEmail);
            helper.setSubject("[DynForge] Chúc mừng! Hồ sơ Mentor môn " + effectiveCourse + " của bạn đã được phê duyệt");
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Mentor approval email sent successfully to {} for course {}", mentorEmail, effectiveCourse);
        } catch (Exception e) {
            log.error("Failed to send mentor approval email to {}: {}", mentorEmail, e.getMessage());
        }
    }

    /**
     * Sends an email notification to an applicant when their verification request is rejected,
     * providing the admin reason and instructions on how to re-apply.
     */
    @Async
    public void sendMentorRejectionEmail(
            String mentorEmail,
            String mentorName,
            String courseCode,
            String rejectionReason
    ) {
        if (mentorEmail == null || mentorEmail.isBlank()) return;

        String greeting = (mentorName != null && !mentorName.isBlank()) ? mentorName : "Bạn";
        String effectiveCourse = (courseCode != null && !courseCode.isBlank()) ? courseCode : "Chuyên môn học thuật";
        String reason = (rejectionReason != null && !rejectionReason.isBlank())
                ? rejectionReason
                : "Hồ sơ hoặc tài liệu minh chứng chưa đáp ứng đầy đủ tiêu chuẩn xác thực của DynForge.";
        String reapplyUrl = (frontendBaseUrl != null ? frontendBaseUrl : "http://localhost:5173") + "/become-a-mentor";

        if (!isConfigured()) {
            log.info("[Mentor Rejection Email] (Mail not configured) Rejection notification sent to {}: Course={}, Reason={}",
                    mentorEmail, effectiveCourse, reason);
            return;
        }

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #1e293b;border-radius:12px;background:#020b18;color:#f8fafc">
                  <h2 style="color:#ef4444;margin:0 0 12px">DynForge - Thông Báo Kết Quả Xét Duyệt Hồ Sơ</h2>
                  <p>Xin chào <b>%s</b>,</p>
                  <p>Cảm ơn bạn đã quan tâm và nộp hồ sơ trở thành Mentor môn <b>%s</b> trên nền tảng DynForge.</p>
                  <p>Rất tiếc, sau khi xem xét kỹ lưỡng tài liệu đính kèm, Ban Quản Trị chưa thể phê duyệt yêu cầu này vào thời điểm hiện tại.</p>
                  <div style="background:#450a0a;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;color:#fecaca">
                    <p style="margin:0 0 6px;font-weight:bold;color:#f87171">Lý do từ Ban Kiểm Duyệt:</p>
                    <p style="margin:0;line-height:1.5">%s</p>
                  </div>
                  <p>Bạn hoàn toàn có thể cập nhật lại bằng chứng học tập (bảng điểm rõ ràng, thông tin trùng khớp) và nộp lại đơn xét duyệt bất kỳ lúc nào.</p>
                  <div style="text-align:center;margin:24px 0">
                    <a href="%s" style="background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Nộp Lại Đơn Xét Duyệt</a>
                  </div>
                  <p style="color:#64748b;font-size:12px;margin-top:24px">DynForge - Peer-to-Peer Academic Mentorship Platform</p>
                </div>
                """.formatted(greeting, effectiveCourse, reason, reapplyUrl);

        sendEmailDirect(mentorEmail, "[DynForge] Thông báo kết quả xét duyệt hồ sơ Mentor môn " + effectiveCourse, html);
    }

    private void sendEmailDirect(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : username;
            helper.setFrom(sender, senderName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email '{}' sent successfully to {}", subject, to);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}: {}", subject, to, e.getMessage());
        }
    }
}

