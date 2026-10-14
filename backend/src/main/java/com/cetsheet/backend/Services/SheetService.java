package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.SheetDTO;
import com.cetsheet.backend.mapper.SheetProgressMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SheetService {

    private final SheetCatalogCacheService sheetCatalogCacheService;
    private final ProgressService progressService;
    private final SheetProgressMapper sheetProgressMapper;

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
        return sheetProgressMapper.mergeCatalogWithProgress(catalog, progressByChapterId);
    }

    public SheetDTO getSheetById(int sheetId) {
        return getSheetById(sheetId, null);
    }

    public SheetDTO getSheetById(int sheetId, Long userId) {
        SheetDTO catalogSheet = sheetCatalogCacheService.findCatalogSheetById(sheetId);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(userId, sheetId);
        return sheetProgressMapper.mergeSheetWithProgress(catalogSheet, progressByChapterId);
    }

    public SheetDTO getSheetByName(String sheetName) {
        return getSheetByName(sheetName, null);
    }

    public SheetDTO getSheetByName(String sheetName, Long userId) {
        SheetDTO catalogSheet = sheetCatalogCacheService.findCatalogSheetByName(sheetName);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(
                userId, catalogSheet.getSheetId());
        return sheetProgressMapper.mergeSheetWithProgress(catalogSheet, progressByChapterId);
    }
}
