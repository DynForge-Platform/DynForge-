package com.dynforge.be.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter filter.
 * Protects public sensitive endpoints (especially /api/auth mutations) against brute-force,
 * credential stuffing, and OTP flooding DDoS attacks.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    /** Maximum allowed POST requests to /api/auth endpoints per IP in 1 minute. */
    private static final int AUTH_POST_LIMIT = 30;

    /** Sliding window duration in milliseconds (1 minute). */
    private static final long WINDOW_MS = 60_000L;

    /** In-memory storage: IP address -> queue of request timestamps. */
    private final Map<String, Deque<Long>> ipRequestMap = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Skip CORS preflight OPTIONS requests immediately
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Rate limit mutating requests to /api/auth (login, register, forgot-password, resend-otp, etc.)
        if (uri != null && uri.startsWith("/api/auth") && "POST".equalsIgnoreCase(method)) {
            String clientIp = extractClientIp(request);
            if (!isAllowed(clientIp, AUTH_POST_LIMIT, WINDOW_MS)) {
                log.warn("Rate limit exceeded for IP: {} on URI: {}", clientIp, uri);
                rejectWithRateLimit(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Checks if the request from the given IP is allowed within the sliding window.
     */
    private boolean isAllowed(String ip, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        long cutoff = now - windowMs;

        Deque<Long> timestamps = ipRequestMap.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    /**
     * Resolves real client IP address, handling reverse proxies, load balancers, and Cloudflare/Azure headers.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            String[] ips = xf.split(",");
            if (ips.length > 0 && !ips[0].isBlank()) {
                return ips[0].trim();
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    /**
     * Returns an HTTP 429 Too Many Requests response with standard JSON payload.
     */
    private void rejectWithRateLimit(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Retry-After", "60");

        String json = "{"
                + "\"timestamp\":\"" + Instant.now() + "\","
                + "\"status\":429,"
                + "\"error\":\"Too Many Requests\","
                + "\"message\":\"Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau 1 phút (Too many requests from this IP. Please try again in 1 minute).\""
                + "}";

        response.getWriter().write(json);
        response.getWriter().flush();
    }

    /**
     * Housekeeping: Purges stale IP tracking entries every 5 minutes to prevent memory leaks.
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanupStaleEntries() {
        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        Iterator<Map.Entry<String, Deque<Long>>> iterator = ipRequestMap.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Deque<Long>> entry = iterator.next();
            Deque<Long> queue = entry.getValue();
            synchronized (queue) {
                while (!queue.isEmpty() && queue.peekFirst() < cutoff) {
                    queue.pollFirst();
                }
                if (queue.isEmpty()) {
                    iterator.remove();
                }
            }
        }
    }
}
