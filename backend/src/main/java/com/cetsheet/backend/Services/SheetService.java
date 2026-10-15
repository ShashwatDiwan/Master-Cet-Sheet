package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.SheetDTO;
import com.cetsheet.backend.mapper.SheetProgressMapper;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SheetService {

    private final SheetCatalogCacheService sheetCatalogCacheService;
    private final ProgressService progressService;
    private final SheetProgressMapper sheetProgressMapper;
    private final ResourceFileRepository resourceFileRepository;

    //when user not logged in call through to the user-aware overload
    public List<SheetDTO> getAllSheets() {
        return getAllSheets(null);
    }

    /**
     * Return every sheet as an expanded read model. Resources are embedded into
     * each chapter and user progress is merged in-memory from a single bulk read.
     * Only the catalog tree is cached.
     */
    public List<SheetDTO> getAllSheets(Long userId) {
        List<SheetDTO> catalog = sheetCatalogCacheService.getCatalog();
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUser(userId);
        List<SheetDTO> result = sheetProgressMapper.mergeCatalogWithProgress(catalog, progressByChapterId);
        applyCurrentViewerAvailability(result);
        return result;
    }

    public SheetDTO getSheetById(int sheetId) {
        return getSheetById(sheetId, null);
    }

    public SheetDTO getSheetById(int sheetId, Long userId) {
        SheetDTO catalogSheet = sheetCatalogCacheService.findCatalogSheetById(sheetId);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(userId, sheetId);
        SheetDTO result = sheetProgressMapper.mergeSheetWithProgress(catalogSheet, progressByChapterId);
        applyCurrentViewerAvailability(List.of(result));
        return result;
    }

    public SheetDTO getSheetByName(String sheetName) {
        return getSheetByName(sheetName, null);
    }

    public SheetDTO getSheetByName(String sheetName, Long userId) {
        SheetDTO catalogSheet = sheetCatalogCacheService.findCatalogSheetByName(sheetName);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(
                userId, catalogSheet.getSheetId());
        SheetDTO result = sheetProgressMapper.mergeSheetWithProgress(catalogSheet, progressByChapterId);
        applyCurrentViewerAvailability(List.of(result));
        return result;
    }

    /**
     * File metadata changes independently of the cached catalog (after an
     * owner upload). Resolve these lightweight availability flags at response
     * time so a Redis entry can never hide a newly attached private PDF.
     */
    private void applyCurrentViewerAvailability(List<SheetDTO> sheets) {
        List<Integer> resourceIds = new ArrayList<>();
        sheets.forEach(sheet -> sheet.getChapters().forEach(chapter ->
                chapter.getResources().forEach(resource -> resourceIds.add(resource.getResourceId()))));

        if (resourceIds.isEmpty()) {
            return;
        }

        Set<Integer> availableIds = new HashSet<>(resourceFileRepository.findExistingResourceIds(resourceIds));
        sheets.forEach(sheet -> sheet.getChapters().forEach(chapter ->
                chapter.getResources().forEach(resource ->
                        resource.setViewerAvailable(availableIds.contains(resource.getResourceId())))));
    }
}
