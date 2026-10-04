package com.dynforge.be.util;

import com.dynforge.be.exception.BadRequestException;

import java.net.URI;
import java.net.URISyntaxException;

public final class UrlValidator {

    public static final int MAX_URL_LENGTH = 2048;

    private UrlValidator() {
    }

    /**
     * Validates that an optional URL, if provided (non-blank), starts with http:// or https://,
     * has a valid host, and does not exceed the maximum allowed length.
     *
     * @param url       the URL string to validate
     * @param fieldName the field name for error reporting
     */
    public static void validateHttpUrl(String url, String fieldName) {
        if (url == null || url.isBlank()) {
            return;
        }

        String trimmed = url.trim();
        if (trimmed.length() > MAX_URL_LENGTH) {
            throw new BadRequestException(fieldName + " quá dài (tối đa " + MAX_URL_LENGTH + " ký tự).");
        }

        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException(fieldName + " phải là đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BadRequestException(fieldName + " không có tên miền hợp lệ.");
            }
        } catch (URISyntaxException e) {
            throw new BadRequestException(fieldName + " không phải là định dạng URL hợp lệ.");
        }
    }
}
