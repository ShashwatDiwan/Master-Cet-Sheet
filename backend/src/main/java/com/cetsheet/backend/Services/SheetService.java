package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Chapter;
import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.ResourceType;
import com.cetsheet.backend.Model.Sheet;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.Repository.SheetRepository;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SheetService {

    private final SheetRepository sheetRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceService resourceService;
    private final ProgressService progressService;

    //when user not logged in call through to the user-aware overload
    public List<SheetDTO> getAllSheets() {
        return getAllSheets(null);
    }

    /**
     * Return every sheet as an expanded read model. Resources are embedded into
     * each chapter and user progress is merged in-memory from a single bulk read.
     */
    public List<SheetDTO> getAllSheets(Long userId) {
        List<Sheet> sheets = sheetRepository.findAllWithChapters();
        return buildExpandedSheets(sheets, userId);
    }

    public SheetDTO getSheetById(int sheetId) {
        return getSheetById(sheetId, null);
    }

    public SheetDTO getSheetById(int sheetId, Long userId) {
        Sheet sheet = sheetRepository.findByIdWithChapters(sheetId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with ID " + sheetId + " not found"));
        return buildExpandedSheets(Collections.singletonList(sheet), userId).get(0);
    }

    public SheetDTO getSheetByName(String sheetName) {
        return getSheetByName(sheetName, null);
    }

    public SheetDTO getSheetByName(String sheetName, Long userId) {
        Sheet sheet = sheetRepository.findBySheetNameWithChapters(sheetName)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sheet with name " + sheetName + " not found"));
        return buildExpandedSheets(Collections.singletonList(sheet), userId).get(0);
    }

    private List<SheetDTO> buildExpandedSheets(List<Sheet> sheets, Long userId) {
        Map<Integer, List<ResourceDTO>> resourcesByChapterId = loadResourcesByChapterId(sheets);
        Map<Integer, ChapterProgressDTO> progressByChapterId = progressService.getProgressMapForUser(userId);

        List<SheetDTO> result = new ArrayList<>();
        for (Sheet sheet : sheets) {
            result.add(toSheetDto(sheet, resourcesByChapterId, progressByChapterId));
        }
        return result;
    }

    private Map<Integer, List<ResourceDTO>> loadResourcesByChapterId(List<Sheet> sheets) {
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

    private SheetDTO toSheetDto(
            Sheet sheet,
            Map<Integer, List<ResourceDTO>> resourcesByChapterId,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        SheetDTO dto = new SheetDTO();
        dto.setSheetId(sheet.getSheetId());
        dto.setSheetName(sheet.getSheetName());
        dto.setSubject(sheet.getSubject());
        dto.setDescription(sheet.getDescription());

        List<ChapterDTO> chapterDTOs = sheet.getChapters().stream()
                .sorted(Comparator.comparingInt(Chapter::getChapterId))
                .map(chapter -> toChapterDto(chapter, resourcesByChapterId, progressByChapterId))
                .toList();

        int completedCount = (int) chapterDTOs.stream().filter(ChapterDTO::isCompleted).count();

        dto.setTotalChapters(chapterDTOs.size());
        dto.setCompletedChapters(completedCount);
        dto.setChapters(chapterDTOs);
        return dto;
    }

    private ChapterDTO toChapterDto(
            Chapter chapter,
            Map<Integer, List<ResourceDTO>> resourcesByChapterId,
            Map<Integer, ChapterProgressDTO> progressByChapterId
    ) {
        ChapterDTO dto = new ChapterDTO();
        dto.setChapterId(chapter.getChapterId());
        dto.setChapterName(chapter.getChapterName());
        dto.setWeightage(chapter.getWeightage());

        List<ResourceDTO> resources = new ArrayList<>(
                resourcesByChapterId.getOrDefault(chapter.getChapterId(), Collections.emptyList())
        );
        dto.setResources(resources);

        ChapterProgressDTO progress = progressByChapterId.get(chapter.getChapterId());
        if (progress != null) {
            dto.setCompleted(progress.isCompleted());
            dto.setRevised(progress.isRevised());
        }

        dto.setHasNotes(hasResourceType(resources, ResourceType.NOTES));
        dto.setHasShortNotes(hasResourceType(resources, ResourceType.SHORT_NOTES));
        dto.setHasPyqs(hasResourceType(resources, ResourceType.PYQS));
        return dto;
    }

    private boolean hasResourceType(List<ResourceDTO> resources, ResourceType type) {
        return resources.stream().anyMatch(resource -> resource.getType() == type);
    }
}
