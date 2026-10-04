package com.dynforge.be.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("prod")
public class ProductionSecurityValidator {

    public static final String DEFAULT_WEBHOOK_SECRET = "dynforge-webhook-secret-change-in-prod";

    @Value("${app.webhook.secret:}")
    private String webhookSecret;

    @PostConstruct
    public void validate() {
        if (webhookSecret == null || webhookSecret.isBlank() || DEFAULT_WEBHOOK_SECRET.equalsIgnoreCase(webhookSecret.trim())) {
            String errorMsg = "CRITICAL SECURITY CONFIGURATION ERROR: In 'prod' profile, 'app.webhook.secret' cannot be left empty or set to the default placeholder ('"
                    + DEFAULT_WEBHOOK_SECRET + "'). Please configure a secure APP_WEBHOOK_SECRET environment variable.";
            log.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
    }

    // Package-private setter for testing
    void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
}
