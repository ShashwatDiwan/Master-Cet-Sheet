package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Chapter;
import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.Sheet;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.Repository.SheetRepository;
import com.cetsheet.backend.config.SheetCatalogCacheProperties;
import com.cetsheet.backend.dto.ResourceDTO;
import com.cetsheet.backend.dto.SheetDTO;
import com.cetsheet.backend.mapper.SheetProgressMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SheetCatalogCacheService {

    //logs cache hits, misses, refreshes and failures
    private static final Logger log = LoggerFactory.getLogger(SheetCatalogCacheService.class);
    private static final TypeReference<List<SheetDTO>> SHEET_LIST_TYPE = new TypeReference<>() { };

    private final SheetRepository sheetRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceService resourceService;
    private final SheetProgressMapper sheetProgressMapper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final SheetCatalogCacheProperties cacheProperties;

    public List<SheetDTO> getCatalog() {
        List<SheetDTO> cachedCatalog = readCatalogFromCache();
        if (cachedCatalog != null) {
            log.info("Sheet catalog cache HIT for key '{}'.", cacheProperties.cacheKey());
            return cachedCatalog;
        }

        log.info("Sheet catalog cache MISS for key '{}'. Loading catalog from database.", cacheProperties.cacheKey());
        List<SheetDTO> catalog = loadCatalogFromDatabase();
        writeCatalogToCache(catalog);
        return catalog;
    }

    public SheetDTO findCatalogSheetById(int sheetId) {
        return getCatalog().stream()
                .filter(sheet -> sheet.getSheetId() == sheetId)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with ID " + sheetId + " not found"));
    }

    public SheetDTO findCatalogSheetByName(String sheetName) {
        return getCatalog().stream()
                .filter(sheet -> sheet.getSheetName().equalsIgnoreCase(sheetName))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with name " + sheetName + " not found"));
    }

    public void warmCatalogCache() {
        getCatalog();
    }

    public void refreshCatalogCache() {
        log.info("Sheet catalog cache REFRESH started for key '{}'.", cacheProperties.cacheKey());
        List<SheetDTO> catalog = loadCatalogFromDatabase();
        writeCatalogToCache(catalog);
        log.info("Sheet catalog cache REFRESH completed for key '{}' with {} sheets.",
                cacheProperties.cacheKey(), catalog.size());
    }

    private List<SheetDTO> readCatalogFromCache() {
        if (!cacheProperties.isEnabled()) {
            return null;
        }

        try {
            String json = redisTemplate.opsForValue().get(cacheProperties.cacheKey());
            if (json == null || json.isBlank()) {
                return null;
            }
            return objectMapper.readValue(json, SHEET_LIST_TYPE);
        } catch (Exception ex) {
            log.warn("Failed to read sheet catalog from Redis key '{}'. Falling back to database.",
                    cacheProperties.cacheKey(), ex);
            return null;
        }
    }

    private void writeCatalogToCache(List<SheetDTO> catalog) {
        if (!cacheProperties.isEnabled()) {
            return;
        }

        try {
            redisTemplate.opsForValue().set(cacheProperties.cacheKey(), objectMapper.writeValueAsString(catalog));
            log.info("Sheet catalog cache WRITE completed for key '{}'.", cacheProperties.cacheKey());
        } catch (Exception ex) {
            log.warn("Failed to write sheet catalog to Redis key '{}'. Continuing without cache.",
                    cacheProperties.cacheKey(), ex);
        }
    }

    private List<SheetDTO> loadCatalogFromDatabase() {
        List<Sheet> sheets = sheetRepository.findAllWithChapters();
        Map<Integer, List<ResourceDTO>> resourcesByChapterId = loadResourcesByChapterId(sheets);
        return sheetProgressMapper.toCatalogDtos(sheets, resourcesByChapterId);
    }

    private Map<Integer, List<ResourceDTO>> loadResourcesByChapterId(
            List<Sheet> sheets
    ) {
        List<Integer> chapterIds = sheets.stream()
                .flatMap(sheet -> sheet.getChapters().stream())
                .map(Chapter::getChapterId)
                .distinct()
                .toList();

        if (chapterIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Resource> resources = resourceRepository.findByChapterIds(chapterIds);
        resources.sort(Comparator.comparingInt(Resource::getResourceId));

        return resources.stream()
                .collect(Collectors.groupingBy(
                        resource -> resource.getChapter().getChapterId(),
                        LinkedHashMap::new,
                        Collectors.mapping(resourceService::toDto, Collectors.toList())
                ));
    }
}
