package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Thin client for the PayOS payment gateway REST API (no SDK dependency).
 * Docs: https://payos.vn/docs
 */
@Slf4j
@Component
public class PayOsClient {

    private final RestClient restClient;
    private final String clientId;
    private final String apiKey;
    private final String checksumKey;

    public PayOsClient(
            @Value("${payos.base-url}") String baseUrl,
            @Value("${payos.client-id}") String clientId,
            @Value("${payos.api-key}") String apiKey,
            @Value("${payos.checksum-key}") String checksumKey
    ) {
        this.restClient = RestClient.create(baseUrl);
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
    }

    /**
     * Creates a payment link and returns the hosted checkout URL to redirect the buyer to.
     */
    public String createPaymentLink(long orderCode, long amount, String description,
                                    String returnUrl, String cancelUrl) {
        // Signature is HMAC-SHA256 over the fields in alphabetical order.
        String signatureData = "amount=" + amount
                + "&cancelUrl=" + cancelUrl
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + returnUrl;
        String signature = hmacSha256(signatureData);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("cancelUrl", cancelUrl);
        body.put("returnUrl", returnUrl);
        body.put("signature", signature);

        Map<?, ?> resp;
        try {
            resp = restClient.post()
                    .uri("/v2/payment-requests")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("PayOS createPaymentLink failed: {}", e.getMessage());
            throw new BadRequestException("Could not create PayOS payment link. Please try again.");
        }

        if (resp == null || !"00".equals(String.valueOf(resp.get("code")))) {
            String desc = resp != null ? String.valueOf(resp.get("desc")) : "no response";
            log.error("PayOS createPaymentLink error: {}", desc);
            throw new BadRequestException("PayOS: " + desc);
        }

        Object dataObj = resp.get("data");
        if (!(dataObj instanceof Map<?, ?> data) || data.get("checkoutUrl") == null) {
            throw new BadRequestException("PayOS did not return a checkout URL.");
        }
        return String.valueOf(data.get("checkoutUrl"));
    }

    /**
     * Returns the payment status for an order: PENDING, PAID, PROCESSING, CANCELLED, EXPIRED.
     */
    public String getPaymentStatus(long orderCode) {
        Map<?, ?> resp;
        try {
            resp = restClient.get()
                    .uri("/v2/payment-requests/{orderCode}", orderCode)
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.error("PayOS getPaymentStatus failed: {}", e.getMessage());
            throw new BadRequestException("Could not verify PayOS payment status.");
        }

        if (resp == null || !"00".equals(String.valueOf(resp.get("code")))) {
            String desc = resp != null ? String.valueOf(resp.get("desc")) : "no response";
            throw new BadRequestException("PayOS: " + desc);
        }

        Object dataObj = resp.get("data");
        if (dataObj instanceof Map<?, ?> data && data.get("status") != null) {
            return String.valueOf(data.get("status"));
        }
        return "PENDING";
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign PayOS request", e);
        }
    }
}
