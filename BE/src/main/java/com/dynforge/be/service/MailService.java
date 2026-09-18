package com.dynforge.be.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email via SMTP (Gmail App Password by default). When spring.mail.username
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

    public MailService(JavaMailSender mailSender,
                       @Value("${spring.mail.username:}") String username,
                       @Value("${app.mail.from:}") String fromEmail,
                       @Value("${app.mail.sender-name:DynForge Support}") String senderName) {
        this.mailSender = mailSender;
        this.username = username;
        this.fromEmail = fromEmail;
        this.senderName = senderName;
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
            // Don't fail the request (and don't leak which emails exist) — log for ops instead.
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
        }
    }
}
