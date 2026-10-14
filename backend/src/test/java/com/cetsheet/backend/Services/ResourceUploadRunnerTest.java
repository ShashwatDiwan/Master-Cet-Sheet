package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.config.ResourceUploadProperties;
import com.cetsheet.backend.config.SupabaseStorageProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResourceUploadRunnerTest {

    @TempDir
    Path tempDir;

    @Test
    void recoversMetadataWhenTheObjectWasUploadedBeforeTheDatabaseWrite() throws Exception {
        Path pdf = createPdf();
        String sha256 = sha256(pdf);
        ResourceRepository resources = mock(ResourceRepository.class);
        ResourceFileRepository files = mock(ResourceFileRepository.class);
        SupabaseStorageService storage = mock(SupabaseStorageService.class);
        SheetCatalogCacheService cache = mock(SheetCatalogCacheService.class);
        when(resources.existsById(7)).thenReturn(true);
        Resource resource = new Resource();
        resource.setResourceId(7);
        when(resources.findById(7)).thenReturn(Optional.of(resource));
        when(files.findById(7)).thenReturn(Optional.empty());
        when(storage.verifyPdf(anyString())).thenReturn(Optional.of(new SupabaseStorageService.StoredPdf(Files.size(pdf), sha256)));

        runner(pdf, resources, files, storage, cache).run(null);

        ArgumentCaptor<com.cetsheet.backend.Model.ResourceFile> saved = ArgumentCaptor.forClass(com.cetsheet.backend.Model.ResourceFile.class);
        verify(files).save(saved.capture());
        assertEquals(sha256, saved.getValue().getSha256());
        assertEquals(Files.size(pdf), saved.getValue().getSizeBytes());
        verify(storage, never()).uploadPdf(anyString(), any());
        verify(cache).refreshCatalogCache();
    }

    @Test
    void refusesToOverwriteADifferentExistingObject() throws Exception {
        Path pdf = createPdf();
        ResourceRepository resources = mock(ResourceRepository.class);
        ResourceFileRepository files = mock(ResourceFileRepository.class);
        SupabaseStorageService storage = mock(SupabaseStorageService.class);
        SheetCatalogCacheService cache = mock(SheetCatalogCacheService.class);
        when(resources.existsById(7)).thenReturn(true);
        Resource resource = new Resource();
        resource.setResourceId(7);
        when(resources.findById(7)).thenReturn(Optional.of(resource));
        when(files.findById(7)).thenReturn(Optional.empty());
        when(storage.verifyPdf(anyString())).thenReturn(Optional.of(new SupabaseStorageService.StoredPdf(1, "different")));

        assertThrows(IllegalStateException.class, () -> runner(pdf, resources, files, storage, cache).run(null));

        verify(storage, never()).uploadPdf(anyString(), any());
        verify(files, never()).save(any());
        verify(cache, never()).refreshCatalogCache();
    }

    private ResourceUploadRunner runner(
            Path pdf,
            ResourceRepository resources,
            ResourceFileRepository files,
            SupabaseStorageService storage,
            SheetCatalogCacheService cache
    ) throws Exception {
        Path manifest = tempDir.resolve("manifest.json");
        Files.writeString(manifest, """
                [{"resourceId":7,"sourcePath":"%s","subject":"Physics","chapterId":12,"type":"NOTES","version":1}]
                """.formatted(pdf.toString().replace("\\", "\\\\")));
        ResourceUploadProperties upload = new ResourceUploadProperties();
        upload.setDryRun(false);
        upload.setManifest(manifest.toString());
        SupabaseStorageProperties storageProperties = new SupabaseStorageProperties();
        storageProperties.setUrl("https://storage.example");
        storageProperties.setServiceRoleKey("server-only-key");
        return new ResourceUploadRunner(upload, storageProperties, new ObjectMapper(), resources, files,
                new ResourceObjectKeyFactory(), storage, cache);
    }

    private Path createPdf() throws Exception {
        Path pdf = tempDir.resolve("notes.pdf");
        Files.writeString(pdf, "%PDF-1.7\\nexample");
        return pdf;
    }

    private String sha256(Path source) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(source)));
    }
}
