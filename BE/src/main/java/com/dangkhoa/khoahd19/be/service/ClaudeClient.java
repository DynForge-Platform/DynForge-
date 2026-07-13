package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Thin client for the Anthropic (Claude) Messages API — no SDK dependency, mirroring
 * {@link PayOsClient}. Uses Spring's {@link RestClient} and parses the JSON response as a
 * {@link Map} (Spring Boot 4.1 ships Jackson 3, so {@code JsonNode} is not on the classpath).
 * Docs: https://docs.claude.com/en/api
 */
@Slf4j
@Component
public class ClaudeClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public ClaudeClient(
            @Value("${anthropic.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${anthropic.api-key:}") String apiKey,
            @Value("${anthropic.model:claude-opus-4-8}") String model
    ) {
        this.restClient = RestClient.create(baseUrl);
        this.apiKey = apiKey;
        this.model = model;
    }

    /** True when an API key is present, so callers can degrade gracefully. */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Sends a single-turn prompt to Claude and returns the concatenated text of the reply.
     *
     * @param systemPrompt persona / task framing
     * @param userPrompt   the actual content to analyse
     * @param maxTokens    output cap
     */
    public String complete(String systemPrompt, String userPrompt, int maxTokens) {
        if (!isConfigured()) {
            throw new BadRequestException(
                    "Tính năng AI chưa được cấu hình. Vui lòng đặt anthropic.api-key trong application.properties.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("system", systemPrompt);
        body.put("messages", List.of(Map.of("role", "user", "content", userPrompt)));

        Map<?, ?> resp;
        try {
            resp = restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("Claude API call failed: {}", e.getMessage());
            throw new BadRequestException("Không gọi được Claude API. Vui lòng thử lại.");
        }

        if (resp == null) {
            throw new BadRequestException("Claude API không trả về dữ liệu.");
        }

        // A message response carries content[] blocks; concatenate the text ones.
        Object contentObj = resp.get("content");
        if (contentObj instanceof List<?> blocks) {
            StringBuilder sb = new StringBuilder();
            for (Object block : blocks) {
                if (block instanceof Map<?, ?> b && "text".equals(String.valueOf(b.get("type")))) {
                    sb.append(String.valueOf(b.get("text")));
                }
            }
            if (!sb.isEmpty()) {
                return sb.toString();
            }
        }
        log.error("Unexpected Claude API response shape: {}", resp);
        throw new BadRequestException("Claude API trả về định dạng không mong đợi.");
    }
}
