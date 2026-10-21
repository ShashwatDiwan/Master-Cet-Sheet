package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.ResourceFile;
import com.cetsheet.backend.Model.ViewerUrlAudit;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.Repository.ViewerUrlAuditRepository;
import com.cetsheet.backend.config.SupabaseStorageProperties;
import com.cetsheet.backend.dto.ViewerUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ViewerUrlService {
    private static final long RESOURCE_WINDOW_LIMIT = 15;
    private static final long DAILY_LIMIT = 200;
    private static final Duration RESOURCE_WINDOW = Duration.ofMinutes(10);
    private static final Duration DAILY_WINDOW = Duration.ofDays(1);

    private final ResourceRepository resourceRepository;
    private final ResourceFileRepository resourceFileRepository;
    private final ViewerUrlAuditRepository auditRepository;
    private final StringRedisTemplate redisTemplate;
    private final SupabaseStorageService storageService;
    private final SupabaseStorageProperties storageProperties;

    public ViewerUrlResponse issue(Long userId, int resourceId) {
        if (!resourceRepository.existsById(resourceId)) {
            audit(userId, resourceId, "NOT_FOUND", "resource not found");
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }

        ResourceFile file = resourceFileRepository.findById(resourceId).orElseThrow(() -> {
            audit(userId, resourceId, "NOT_READY", "private file not uploaded");
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "PDF is not available yet");
        });

        try {
            consumeQuota(userId, resourceId);
        } catch (ViewerUrlRateLimitException ex) {
            audit(userId, resourceId, "RATE_LIMITED", "quota exceeded");
            throw ex;
        }

        try {
            String signedUrl = storageService.createSignedUrl(file.getObjectKey());
            Instant expiresAt = Instant.now().plusSeconds(storageProperties.getSignedUrlTtlSeconds());
            audit(userId, resourceId, "ISSUED", null);
            return new ViewerUrlResponse(signedUrl, expiresAt);
        } catch (RuntimeException ex) {
            audit(userId, resourceId, "ERROR", "signed URL unavailable");
            throw ex;
        }
    }

    private void consumeQuota(Long userId, int resourceId) {
        try {
            String resourceKey = "viewer-url:resource:" + userId + ":" + resourceId;
            long resourceCount = increment(resourceKey, RESOURCE_WINDOW);
            if (resourceCount > RESOURCE_WINDOW_LIMIT) {
                throw new ViewerUrlRateLimitException(retryAfter(resourceKey, RESOURCE_WINDOW));
            }

            String dailyKey = "viewer-url:day:" + LocalDate.now(ZoneOffset.UTC) + ":" + userId;
            long dailyCount = increment(dailyKey, DAILY_WINDOW);
            if (dailyCount > DAILY_LIMIT) {
                throw new ViewerUrlRateLimitException(secondsUntilNextUtcDay());
            }
        } catch (ViewerUrlRateLimitException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Viewer rate limiter is unavailable", ex);
        }
    }

    private long increment(String key, Duration duration) {
        Long value = redisTemplate.opsForValue().increment(key);
        if (value != null && value == 1L) {
            redisTemplate.expire(key, duration);
        }
        return value == null ? Long.MAX_VALUE : value;
    }

    private long retryAfter(String key, Duration fallback) {
        Long remaining = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return remaining != null && remaining > 0 ? remaining : fallback.toSeconds();
    }

    private long secondsUntilNextUtcDay() {
        Instant nextMidnight = LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return Math.max(1, Duration.between(Instant.now(), nextMidnight).toSeconds());
    }

    private void audit(Long userId, int resourceId, String outcome, String reason) {
        ViewerUrlAudit audit = new ViewerUrlAudit();
        audit.setUserId(userId);
        audit.setResourceId(resourceId);
        audit.setRequestedAt(Instant.now());
        audit.setOutcome(outcome);
        audit.setDenialReason(reason);
        auditRepository.save(audit);
    }
}
