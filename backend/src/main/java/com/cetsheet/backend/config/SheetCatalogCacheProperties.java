package com.cetsheet.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.cache.sheet-catalog")
public class SheetCatalogCacheProperties {

    private boolean enabled = true;
    private String keyPrefix = "sheetCatalog";
    private String version = "v1";
    private boolean warmOnStartup = true;

    public String cacheKey() {
        return keyPrefix + ":" + version;
    }
}
