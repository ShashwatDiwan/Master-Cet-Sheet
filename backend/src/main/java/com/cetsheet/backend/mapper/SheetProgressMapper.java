package com.cetsheet.backend.mapper;

import com.cetsheet.backend.Model.Chapter;
import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.ResourceType;
import com.cetsheet.backend.Model.Sheet;
import com.cetsheet.backend.dto.ChapterDTO;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.ResourceDTO;
import com.cetsheet.backend.dto.SheetDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Comparator;

/** Builds user-facing sheet DTOs by merging the shared catalog with progress. */
@Component
public class SheetProgressMapper {

    public List<SheetDTO> toCatalogDtos(
            List<Sheet> sheets,
            Map<Integer, List<ResourceDTO>> resourcesByChapterId
    ) {
        List<SheetDTO> result = new ArrayList<>();
        for (Sheet sheet : sheets) {
            result.add(toCatalogSheetDto(sheet, resourcesByChapterId));
        }
        return result;
    }

    private SheetDTO toCatalogSheetDto(Sheet sheet, Map<Integer, List<ResourceDTO>> resourcesByChapterId) {
        SheetDTO dto = new SheetDTO();
        dto.setSheetId(sheet.getSheetId());
        dto.setSheetName(sheet.getSheetName());
        dto.setSubject(sheet.getSubject());
        dto.setDescription(sheet.getDescription());

        List<ChapterDTO> chapterDTOs = sheet.getChapters().stream()
                .sorted(Comparator.comparingInt(Chapter::getChapterId))
                .map(chapter -> toCatalogChapterDto(chapter, resourcesByChapterId))
                .toList();

        dto.setTotalChapters(chapterDTOs.size());
        dto.setCompletedChapters(0);
        dto.setChapters(chapterDTOs);
        return dto;
    }

    private ChapterDTO toCatalogChapterDto(
            Chapter chapter,
            Map<Integer, List<ResourceDTO>> resourcesByChapterId
    ) {
        ChapterDTO dto = new ChapterDTO();
        dto.setChapterId(chapter.getChapterId());
        dto.setChapterName(chapter.getChapterName());
        dto.setWeightage(chapter.getWeightage());

        List<ResourceDTO> resources = new ArrayList<>(
                resourcesByChapterId.getOrDefault(chapter.getChapterId(), Collections.emptyList())
        );
        dto.setResources(resources);
        dto.setCompleted(false);
        dto.setRevised(false);
        dto.setHasNotes(hasResourceType(resources, ResourceType.NOTES));
        dto.setHasShortNotes(hasResourceType(resources, ResourceType.SHORT_NOTES));
        dto.setHasPyqs(hasResourceType(resources, ResourceType.PYQS));
        return dto;
    }

    public ResourceDTO toResourceDto(Resource resource) {
        ResourceDTO dto = new ResourceDTO();
        dto.setResourceId(resource.getResourceId());
        dto.setResourceName(resource.getResourceName());
        dto.setType(resource.getType());
        // Private PDFs are resolved only through the authenticated viewer endpoint.
        // This catalog intentionally contains neither Drive IDs nor Storage URLs.
        dto.setViewerAvailable(false);
        return dto;
    }

    private boolean hasResourceType(List<ResourceDTO> resources, ResourceType type) {
        return resources.stream().anyMatch(resource -> resource.getType() == type);
    }

    public List<SheetDTO> mergeCatalogWithProgress(
            List<SheetDTO> catalog,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        List<SheetDTO> result = new ArrayList<>();
        for (SheetDTO sheet : catalog) {
            result.add(mergeSheetWithProgress(sheet, progressByChapterId));
        }
        return result;
    }

    public SheetDTO mergeSheetWithProgress(
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
                    resource.isViewerAvailable()
            ));
        }
        return copies;
    }
}
