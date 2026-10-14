package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.ResourceFile;
import com.cetsheet.backend.Model.ResourceType;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.config.ResourceUploadProperties;
import com.cetsheet.backend.config.SupabaseStorageProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** One-shot, explicitly enabled importer for owner-authored PDFs. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.resource-upload", name = "enabled", havingValue = "true")
public class ResourceUploadRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ResourceUploadRunner.class);

    private final ResourceUploadProperties uploadProperties;
    private final SupabaseStorageProperties storageProperties;
    private final ObjectMapper objectMapper;
    private final ResourceRepository resourceRepository;
    private final ResourceFileRepository resourceFileRepository;
    private final ResourceObjectKeyFactory objectKeyFactory;
    private final SupabaseStorageService storageService;
    private final SheetCatalogCacheService sheetCatalogCacheService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (uploadProperties.getManifest() == null || uploadProperties.getManifest().isBlank()) {
            throw new IllegalStateException("RESOURCE_UPLOAD_MANIFEST is required when RESOURCE_UPLOAD_ENABLED=true");
        }

        List<ManifestEntry> entries = objectMapper.readValue(Path.of(uploadProperties.getManifest()).toFile(),
                new TypeReference<List<ManifestEntry>>() { });
        validate(entries);
        if (uploadProperties.isDryRun()) {
            log.warn("Resource upload dry run passed for {} files. No object or database record was changed.", entries.size());
            return;
        }
        if (!storageProperties.isConfigured()) {
            throw new IllegalStateException("Supabase Storage must be configured before a real upload");
        }

        for (ManifestEntry entry : entries) {
            uploadOrRecover(entry);
        }
        sheetCatalogCacheService.refreshCatalogCache();
        log.info("Resource upload completed for {} files.", entries.size());
    }

    private void validate(List<ManifestEntry> entries) throws IOException {
        if (entries == null || entries.isEmpty()) {
            throw new IllegalArgumentException("Upload manifest has no entries");
        }
        Set<Integer> resourceIds = new HashSet<>();
        Set<String> objectKeys = new HashSet<>();
        for (ManifestEntry entry : entries) {
            if (!resourceIds.add(entry.getResourceId())) {
                throw new IllegalArgumentException("Manifest repeats resourceId " + entry.getResourceId());
            }
            Path source = Path.of(entry.getSourcePath());
            if (!Files.isRegularFile(source) || !source.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".pdf")) {
                throw new IllegalArgumentException("Manifest source is not a PDF file: " + source);
            }
            if (!hasPdfSignature(source)) {
                throw new IllegalArgumentException("Manifest source does not have a PDF signature: " + source);
            }
            if (Files.size(source) > storageProperties.getMaxFileBytes()) {
                throw new IllegalArgumentException("Manifest file exceeds configured Storage limit: " + source);
            }
            ResourceType type = ResourceType.valueOf(entry.getType().toUpperCase(Locale.ROOT));
            String objectKey = objectKeyFactory.create(entry.getSubject(), entry.getChapterId(), type,
                    entry.getResourceId(), entry.getVersion());
            if (!objectKeys.add(objectKey)) {
                throw new IllegalArgumentException("Manifest creates a duplicate object key: " + objectKey);
            }
            if (!resourceRepository.existsById(entry.getResourceId())) {
                throw new IllegalArgumentException("Manifest resource does not exist: " + entry.getResourceId());
            }
        }
    }

    private boolean hasPdfSignature(Path source) throws IOException {
        byte[] signature = new byte[5];
        try (InputStream input = Files.newInputStream(source)) {
            return input.read(signature) == signature.length
                    && signature[0] == '%'
                    && signature[1] == 'P'
                    && signature[2] == 'D'
                    && signature[3] == 'F'
                    && signature[4] == '-';
        }
    }

    private void uploadOrRecover(ManifestEntry entry) throws IOException, NoSuchAlgorithmException {
        Resource resource = resourceRepository.findById(entry.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + entry.getResourceId()));
        Path source = Path.of(entry.getSourcePath());
        ResourceType type = ResourceType.valueOf(entry.getType().toUpperCase(Locale.ROOT));
        String objectKey = objectKeyFactory.create(entry.getSubject(), entry.getChapterId(), type,
                entry.getResourceId(), entry.getVersion());
        String sha256 = sha256(source);

        long sizeBytes = Files.size(source);
        ResourceFile existing = resourceFileRepository.findById(entry.getResourceId()).orElse(null);
        java.util.Optional<SupabaseStorageService.StoredPdf> remote = storageService.verifyPdf(objectKey);

        if (remote.isPresent()) {
            if (!remote.get().matches(sizeBytes, sha256)) {
                throw new IllegalStateException("Refusing to overwrite an existing Supabase object with different content: " + objectKey);
            }

            if (matches(existing, objectKey, sizeBytes, sha256)) {
                log.info("Skipping resource {}: Storage object and database metadata are verified.", entry.getResourceId());
                return;
            }

            // Recovery path: Storage accepted a prior upload but the process stopped
            // before its database transaction completed. The object is verified first.
            saveMetadata(existing, resource, objectKey, entry.getVersion(), sizeBytes, sha256);
            log.info("Recovered metadata for previously uploaded resource {}.", entry.getResourceId());
            return;
        }

        storageService.uploadPdf(objectKey, source);
        SupabaseStorageService.StoredPdf verified = storageService.verifyPdf(objectKey)
                .orElseThrow(() -> new IllegalStateException("Supabase did not retain uploaded object: " + objectKey));
        if (!verified.matches(sizeBytes, sha256)) {
            throw new IllegalStateException("Supabase object hash or size did not match the local PDF: " + objectKey);
        }
        saveMetadata(existing, resource, objectKey, entry.getVersion(), sizeBytes, sha256);
        log.info("Uploaded and verified resource {} at {}.", entry.getResourceId(), objectKey);
    }

    private boolean matches(ResourceFile existing, String objectKey, long sizeBytes, String sha256) {
        return existing != null
                && objectKey.equals(existing.getObjectKey())
                && Long.valueOf(sizeBytes).equals(existing.getSizeBytes())
                && sha256.equalsIgnoreCase(existing.getSha256());
    }

    private void saveMetadata(
            ResourceFile existing,
            Resource resource,
            String objectKey,
            int version,
            long sizeBytes,
            String sha256
    ) {
        ResourceFile stored = existing == null ? new ResourceFile() : existing;
        stored.setResource(resource);
        stored.setObjectKey(objectKey);
        stored.setVersion(version);
        stored.setContentType("application/pdf");
        stored.setSizeBytes(sizeBytes);
        stored.setSha256(sha256);
        stored.setUploadedAt(Instant.now());
        resourceFileRepository.save(stored);
    }

    private String sha256(Path source) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = Files.newInputStream(source)) {
            byte[] buffer = new byte[8192];
            for (int read; (read = input.read(buffer)) > 0; ) {
                digest.update(buffer, 0, read);
            }
        }
        return java.util.HexFormat.of().formatHex(digest.digest());
    }

    @Data
    public static class ManifestEntry {
        private int resourceId;
        private String sourcePath;
        private String subject;
        private int chapterId;
        private String type;
        private int version = 1;
    }
}
