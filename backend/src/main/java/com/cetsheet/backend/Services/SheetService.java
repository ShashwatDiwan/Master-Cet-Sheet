package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.ChapterDTO;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.ResourceDTO;
import com.cetsheet.backend.dto.SheetDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SheetService {

    private final SheetCatalogCacheService sheetCatalogCacheService;
    private final ProgressService progressService;

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
        return mergeCatalogWithProgress(catalog, progressByChapterId);
    }

    public SheetDTO getSheetById(int sheetId) {
        return getSheetById(sheetId, null);
    }

    public SheetDTO getSheetById(int sheetId, Long userId) {
        SheetDTO catalogSheet = findCatalogSheetById(sheetId);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(userId, sheetId);
        return mergeSheetWithProgress(catalogSheet, progressByChapterId);
    }

    public SheetDTO getSheetByName(String sheetName) {
        return getSheetByName(sheetName, null);
    }

    public SheetDTO getSheetByName(String sheetName, Long userId) {
        SheetDTO catalogSheet = findCatalogSheetByName(sheetName);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUserBySheet(
                userId, catalogSheet.getSheetId());
        return mergeSheetWithProgress(catalogSheet, progressByChapterId);
    }

    private List<SheetDTO> mergeCatalogWithProgress(
            List<SheetDTO> catalog,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        List<SheetDTO> result = new ArrayList<>();
        for (SheetDTO sheet : catalog) {
            result.add(mergeSheetWithProgress(sheet, progressByChapterId));
        }
        return result;
    }

    private SheetDTO findCatalogSheetById(int sheetId) {
        return sheetCatalogCacheService.getCatalog().stream()
                .filter(sheet -> sheet.getSheetId() == sheetId)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with ID " + sheetId + " not found"));
    }

    private SheetDTO findCatalogSheetByName(String sheetName) {
        return sheetCatalogCacheService.getCatalog().stream()
                .filter(sheet -> sheet.getSheetName().equalsIgnoreCase(sheetName))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with name " + sheetName + " not found"));
    }

    private SheetDTO mergeSheetWithProgress(
            SheetDTO catalogSheet,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        SheetDTO dto = new SheetDTO();
        dto.setSheetId(catalogSheet.getSheetId());
        dto.setSheetName(catalogSheet.getSheetName());
        dto.setSubject(catalogSheet.getSubject());
        dto.setDescription(catalogSheet.getDescription());

        List<ChapterDTO> chapterDTOs = new ArrayList<>();
        for (ChapterDTO chapter : catalogSheet.getChapters()) {
            chapterDTOs.add(mergeChapterWithProgress(chapter, progressByChapterId));
        }

        int completedCount = (int) chapterDTOs.stream().filter(ChapterDTO::isCompleted).count();

        dto.setTotalChapters(catalogSheet.getTotalChapters());
        dto.setCompletedChapters(completedCount);
        dto.setChapters(chapterDTOs);
        return dto;
    }

    private ChapterDTO mergeChapterWithProgress(
            ChapterDTO catalogChapter,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        ChapterDTO dto = new ChapterDTO();
        dto.setChapterId(catalogChapter.getChapterId());
        dto.setChapterName(catalogChapter.getChapterName());
        dto.setWeightage(catalogChapter.getWeightage());
        dto.setResources(copyResources(catalogChapter.getResources()));
        dto.setHasNotes(catalogChapter.isHasNotes());
        dto.setHasShortNotes(catalogChapter.isHasShortNotes());
        dto.setHasPyqs(catalogChapter.isHasPyqs());

        ChapterProgressDTO progress = progressByChapterId.get(catalogChapter.getChapterId());
        if (progress != null) {
            dto.setCompleted(progress.isCompleted());
            dto.setRevised(progress.isRevised());
        } else {
            dto.setCompleted(false);
            dto.setRevised(false);
        }
        return dto;
    }

    private List<ResourceDTO> copyResources(List<ResourceDTO> resources) {
        if (resources == null || resources.isEmpty()) {
            return Collections.emptyList();
        }

        List<ResourceDTO> copies = new ArrayList<>(resources.size());
        for (ResourceDTO resource : resources) {
            copies.add(new ResourceDTO(
                    resource.getResourceId(),
                    resource.getResourceName(),
                    resource.getType(),
                    resource.getDriveFileId(),
                    resource.getPreviewUrl()
            ));
        }
        return copies;
    }
}
