package com.dynforge.be.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductionSecurityValidatorTest {

    @Test
    @DisplayName("Should throw IllegalStateException when webhook secret is default placeholder")
    void shouldThrowWhenDefaultWebhookSecret() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        validator.setWebhookSecret("dynforge-webhook-secret-change-in-prod");

        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when webhook secret is null or blank")
    void shouldThrowWhenBlankWebhookSecret() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        validator.setWebhookSecret("");

        assertThrows(IllegalStateException.class, validator::validate);

        validator.setWebhookSecret(null);
        assertThrows(IllegalStateException.class, validator::validate);

        validator.setWebhookSecret("   ");
        assertThrows(IllegalStateException.class, validator::validate);
    }

    @Test
    @DisplayName("Should succeed when valid custom webhook secret is provided")
    void shouldSucceedWhenValidWebhookSecret() {
        ProductionSecurityValidator validator = new ProductionSecurityValidator();
        validator.setWebhookSecret("super-secret-random-production-token-12345");

        assertDoesNotThrow(validator::validate);
    }
}
