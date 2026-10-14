package com.cetsheet.backend.Services;

import com.cetsheet.backend.config.SupabaseStorageProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {
    private final SupabaseStorageProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public String createSignedUrl(String objectKey) {
        requireConfiguration();
        try {
            HttpRequest request = requestBuilder("/storage/v1/object/sign/" + properties.getBucket() + "/" + encodePath(objectKey))
                    .POST(HttpRequest.BodyPublishers.ofString("{\"expiresIn\":" + properties.getSignedUrlTtlSeconds() + "}"))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw storageFailure("Supabase did not create a signed URL", response.statusCode());
            }
            JsonNode body = objectMapper.readTree(response.body());
            String signedUrl = body.path("signedURL").asText(body.path("signedUrl").asText());
            if (signedUrl == null || signedUrl.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Supabase returned an invalid signed URL");
            }
            return signedUrl.startsWith("http") ? signedUrl : normalizedBaseUrl() + "/storage/v1" + signedUrl;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Supabase Storage", ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Supabase Storage", ex);
        }
    }

    public void uploadPdf(String objectKey, Path source) {
        requireConfiguration();
        try {
            HttpRequest request = requestBuilder("/storage/v1/object/" + properties.getBucket() + "/" + encodePath(objectKey))
                    .header("x-upsert", "false")
                    .header("Content-Type", "application/pdf")
                    .PUT(HttpRequest.BodyPublishers.ofFile(source))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw storageFailure("Supabase upload failed for " + source.getFileName(), response.statusCode());
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to upload to Supabase Storage", ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to upload to Supabase Storage", ex);
        }
    }

    /**
     * Downloads an object with the server credential and calculates its SHA-256.
     * The upload runner uses this before skipping or recording an object, so an
     * interrupted run can safely be repeated without trusting stale database metadata.
     */
    public Optional<StoredPdf> verifyPdf(String objectKey) {
        requireConfiguration();
        try {
            HttpRequest request = requestBuilder("/storage/v1/object/authenticated/" + properties.getBucket() + "/" + encodePath(objectKey))
                    .GET()
                    .build();
            HttpResponse<java.io.InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() == HttpStatus.NOT_FOUND.value()) {
                response.body().close();
                return Optional.empty();
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                response.body().close();
                throw storageFailure("Supabase could not verify an uploaded object", response.statusCode());
            }

            try (java.io.InputStream input = response.body()) {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long sizeBytes = 0;
                byte[] buffer = new byte[8192];
                for (int read; (read = input.read(buffer)) > 0; ) {
                    digest.update(buffer, 0, read);
                    sizeBytes += read;
                }
                return Optional.of(new StoredPdf(sizeBytes, HexFormat.of().formatHex(digest.digest())));
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify Supabase Storage object", ex);
        } catch (IOException | NoSuchAlgorithmException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify Supabase Storage object", ex);
        }
    }

    public record StoredPdf(long sizeBytes, String sha256) {
        public boolean matches(long expectedSizeBytes, String expectedSha256) {
            return sizeBytes == expectedSizeBytes && sha256.equalsIgnoreCase(expectedSha256);
        }
    }

    private HttpRequest.Builder requestBuilder(String path) {
        return HttpRequest.newBuilder(URI.create(normalizedBaseUrl() + path))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + properties.getServiceRoleKey())
                .header("apikey", properties.getServiceRoleKey())
                .header("Accept", "application/json");
    }

    private String normalizedBaseUrl() {
        return properties.getUrl().replaceAll("/+$", "");
    }

    private String encodePath(String value) {
        return java.util.Arrays.stream(value.split("/", -1))
                .map(segment -> URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(java.util.stream.Collectors.joining("/"));
    }

    private void requireConfiguration() {
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase Storage is not configured");
        }
    }

    private ResponseStatusException storageFailure(String message, int statusCode) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message + " (status " + statusCode + ")");
    }
}
