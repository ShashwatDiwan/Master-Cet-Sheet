package com.cetsheet.backend.dto;

import java.time.Instant;

public record ViewerUrlResponse(String signedUrl, Instant expiresAt) {
}
