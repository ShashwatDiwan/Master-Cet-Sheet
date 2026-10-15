package com.cetsheet.backend.Services;

public class BirbalRateLimitException extends RuntimeException {
    private final long retryAfterSeconds;

    public BirbalRateLimitException(long retryAfterSeconds) {
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
