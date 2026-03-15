package com.cetsheet.backend.Services;

import com.cetsheet.backend.config.SheetCatalogCacheProperties;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SheetCatalogCacheWarmup {

    private static final Logger log = LoggerFactory.getLogger(SheetCatalogCacheWarmup.class);

    private final SheetCatalogCacheService sheetCatalogCacheService;
    private final SheetCatalogCacheProperties cacheProperties;

    @EventListener(ApplicationReadyEvent.class)
    public void warmCatalogCache() {
        if (!cacheProperties.isEnabled() || !cacheProperties.isWarmOnStartup()) {
            return;
        }

        try {
            sheetCatalogCacheService.warmCatalogCache();
            log.info("Sheet catalog cache warmed for key '{}'.", cacheProperties.cacheKey());
        } catch (Exception ex) {
            log.warn("Sheet catalog cache warmup failed for key '{}'. The application will continue and lazily load the catalog on demand.",
                    cacheProperties.cacheKey(), ex);
        }
    }
}
