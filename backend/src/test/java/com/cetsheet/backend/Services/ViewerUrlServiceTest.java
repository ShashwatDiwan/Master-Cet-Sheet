package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.ResourceFile;
import com.cetsheet.backend.Model.ViewerUrlAudit;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.Repository.ViewerUrlAuditRepository;
import com.cetsheet.backend.config.SupabaseStorageProperties;
import com.cetsheet.backend.dto.ViewerUrlResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ViewerUrlServiceTest {
    private ResourceRepository resourceRepository;
    private ResourceFileRepository resourceFileRepository;
    private ViewerUrlAuditRepository auditRepository;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> values;
    private SupabaseStorageService storageService;
    private SupabaseStorageProperties storageProperties;
    private ViewerUrlService service;

    @BeforeEach
    void setUp() {
        resourceRepository = mock(ResourceRepository.class);
        resourceFileRepository = mock(ResourceFileRepository.class);
        auditRepository = mock(ViewerUrlAuditRepository.class);
        redisTemplate = mock(StringRedisTemplate.class);
        values = mock(ValueOperations.class);
        storageService = mock(SupabaseStorageService.class);
        storageProperties = new SupabaseStorageProperties();
        when(redisTemplate.opsForValue()).thenReturn(values);
        service = new ViewerUrlService(resourceRepository, resourceFileRepository, auditRepository, redisTemplate, storageService, storageProperties);
    }

    @Test
    void issuesSignedUrlAndAuditsAuthenticatedRequest() {
        ResourceFile file = new ResourceFile();
        file.setObjectKey("resources/physics/chapter-1/notes/resource-7/v1.pdf");
        when(values.increment(anyString())).thenReturn(1L, 1L);
        when(resourceRepository.existsById(7)).thenReturn(true);
        when(resourceFileRepository.findById(7)).thenReturn(Optional.of(file));
        when(storageService.createSignedUrl(file.getObjectKey())).thenReturn("https://storage.example/signed");

        ViewerUrlResponse response = service.issue(5L, 7);

        assertEquals("https://storage.example/signed", response.signedUrl());
        ArgumentCaptor<ViewerUrlAudit> audit = ArgumentCaptor.forClass(ViewerUrlAudit.class);
        verify(auditRepository).save(audit.capture());
        assertEquals("ISSUED", audit.getValue().getOutcome());
        assertEquals(5L, audit.getValue().getUserId());
        assertEquals(7, audit.getValue().getResourceId());
    }

    @Test
    void auditsMissingResourceWithoutCallingStorage() {
        when(values.increment(anyString())).thenReturn(1L, 1L);
        when(resourceRepository.existsById(7)).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> service.issue(5L, 7));

        assertEquals(404, exception.getStatusCode().value());
        verify(storageService, never()).createSignedUrl(anyString());
        ArgumentCaptor<ViewerUrlAudit> audit = ArgumentCaptor.forClass(ViewerUrlAudit.class);
        verify(auditRepository).save(audit.capture());
        assertEquals("NOT_FOUND", audit.getValue().getOutcome());
    }

    @Test
    void rateLimitsAndAuditsRepeatedRequests() {
        when(values.increment(anyString())).thenReturn(16L, 1L);

        assertThrows(ViewerUrlRateLimitException.class, () -> service.issue(5L, 7));

        verify(resourceRepository, never()).existsById(any());
        ArgumentCaptor<ViewerUrlAudit> audit = ArgumentCaptor.forClass(ViewerUrlAudit.class);
        verify(auditRepository).save(audit.capture());
        assertEquals("RATE_LIMITED", audit.getValue().getOutcome());
    }
}
