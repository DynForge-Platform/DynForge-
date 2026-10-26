package com.dynforge.be.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
    }

    @Test
    @DisplayName("Allows up to 30 POST requests to /api/auth within 1 minute, blocks the 31st with HTTP 429")
    void testAuthPostRateLimiting() throws Exception {
        String testIp = "203.0.113.195";

        // First 30 requests should succeed
        for (int i = 1; i <= 30; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr(testIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus(), "Request " + i + " should be allowed");
        }

        // 31st request should be rejected with HTTP 429
        MockHttpServletRequest rejectedRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        rejectedRequest.setRemoteAddr(testIp);
        MockHttpServletResponse rejectedResponse = new MockHttpServletResponse();
        MockFilterChain rejectedChain = new MockFilterChain();

        rateLimitingFilter.doFilter(rejectedRequest, rejectedResponse, rejectedChain);

        assertEquals(429, rejectedResponse.getStatus());
        assertEquals("60", rejectedResponse.getHeader("Retry-After"));
        assertTrue(rejectedResponse.getContentAsString().contains("Too Many Requests"));
    }

    @Test
    @DisplayName("OPTIONS requests are bypassed without consuming rate limit quota")
    void testOptionsBypass() throws Exception {
        String testIp = "203.0.113.196";

        for (int i = 1; i <= 35; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
            request.setRemoteAddr(testIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
        }
    }

    @Test
    @DisplayName("Non-auth requests are not throttled by auth rate limiter")
    void testNonAuthEndpointsNotThrottled() throws Exception {
        String testIp = "203.0.113.197";

        for (int i = 1; i <= 35; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/mentors/search");
            request.setRemoteAddr(testIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
        }
    }
}
