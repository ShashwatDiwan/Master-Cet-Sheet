package com.cetsheet.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.supabase-storage")
public class SupabaseStorageProperties {
    private String url;
    private String serviceRoleKey;
    private String bucket = "cet-resources";
    private long signedUrlTtlSeconds = 3600;
    private long maxFileBytes = 52_428_800;

    public boolean isConfigured() {
        return url != null && !url.isBlank() && serviceRoleKey != null && !serviceRoleKey.isBlank();
    }
}
