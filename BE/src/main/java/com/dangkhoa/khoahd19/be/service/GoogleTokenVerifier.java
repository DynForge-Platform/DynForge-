package com.dangkhoa.khoahd19.be.service;

import com.dangkhoa.khoahd19.be.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Verifies a Google Sign-In ID token against Google's tokeninfo endpoint (no SDK dependency).
 * The endpoint validates the signature and expiry; we additionally check the audience matches
 * our OAuth client id so tokens issued for other apps are rejected.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {

    /** Verified identity claims extracted from the Google ID token. */
    public record GoogleUser(String email, String fullName, String avatarUrl) {}

    private final RestClient restClient = RestClient.create("https://oauth2.googleapis.com");
    private final String clientId;

    public GoogleTokenVerifier(@Value("${google.client-id}") String clientId) {
        this.clientId = clientId;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }

    public String getClientId() {
        return clientId;
    }

    public GoogleUser verify(String idToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Google Sign-In is not configured (missing google.client-id)");
        }

        Map<?, ?> claims;
        try {
            claims = restClient.get()
                    .uri(uri -> uri.path("/tokeninfo").queryParam("id_token", idToken).build())
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            log.warn("Google tokeninfo rejected the token: {}", e.getMessage());
            throw new BadRequestException("Invalid Google token, please sign in again");
        }

        if (claims == null || !clientId.equals(String.valueOf(claims.get("aud")))) {
            throw new BadRequestException("Google token was not issued for this application");
        }
        if (!"true".equals(String.valueOf(claims.get("email_verified")))) {
            throw new BadRequestException("Your Google email is not verified");
        }

        String email = String.valueOf(claims.get("email"));
        Object name = claims.get("name");
        Object picture = claims.get("picture");
        return new GoogleUser(
                email,
                name != null ? String.valueOf(name) : email,
                picture != null ? String.valueOf(picture) : null);
    }
}
