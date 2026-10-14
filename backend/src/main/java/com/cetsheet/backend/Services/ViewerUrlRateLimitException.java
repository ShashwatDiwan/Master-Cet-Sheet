package com.cetsheet.backend.Services;

public class ViewerUrlRateLimitException extends RuntimeException {
    private final long retryAfterSeconds;

    public ViewerUrlRateLimitException(long retryAfterSeconds) {
        super("Viewer URL request limit exceeded");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
