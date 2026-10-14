package com.cetsheet.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.resource-upload")
public class ResourceUploadProperties {
    private boolean enabled;
    private boolean dryRun = true;
    private String manifest;
}
