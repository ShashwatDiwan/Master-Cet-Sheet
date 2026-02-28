
package com.cetsheet.backend.Services;
import com.cetsheet.backend.Model.Sheet;
import com.cetsheet.backend.Repository.SheetRepository;
import com.cetsheet.backend.dto.SheetDTO;
import com.cetsheet.backend.dto.ChapterDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class SheetService {
    @Autowired
    private SheetRepository sheetRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private ProgressService progressService; // to consult user progress

    //when user not logged in call through to the user-aware overload
    public List<SheetDTO> getAllSheets(){
        return getAllSheets(null);
    }

    /**
     * Return every sheet with chapters annotated according to the supplied
     * userId. If the id is null the progress flags will remain false.
     */
    public List<SheetDTO> getAllSheets(Long userId){
        List<Sheet> sheets = sheetRepository.findAll();
        List<SheetDTO> result = new ArrayList<>();

        for (Sheet sheet : sheets) {
            result.add(mapSheetToDTO(sheet, userId));
        }
        return result;
    }



    public SheetDTO getSheetById(int sheetId) {
        return getSheetById(sheetId, null);
    }

    public SheetDTO getSheetById(int sheetId, Long userId) {
        Sheet sheet = sheetRepository.findById(sheetId).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Sheet with ID " + sheetId + " not found"));
        return mapSheetToDTO(sheet, userId);
    }



    public SheetDTO getSheetByName(String sheetName) {
        Sheet sheet = sheetRepository.findBysheetName(sheetName).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Sheet with name " + sheetName + " not found"));
        return mapSheetToDTO(sheet, null);
    }

    private SheetDTO mapSheetToDTO(Sheet sheet, Long userId) {
        SheetDTO dto = modelMapper.map(sheet, SheetDTO.class);

        // Set computed fields
        dto.setSheetId(sheet.getSheetId());
        dto.setTotalChapters(sheet.getChapters().size());

        // Count completed chapters using simple loop, consider user progress if available
        int completedCount = 0;
        List<ChapterDTO> chapterDTOs = new ArrayList<>();
        for (com.cetsheet.backend.Model.Chapter chapter : sheet.getChapters()) {
            ChapterDTO chDto = mapChapterToDTO(chapter, userId);
            chapterDTOs.add(chDto);
            if (chDto.isCompleted()) {
                completedCount++;
            }
        }
        dto.setCompletedChapters(completedCount);
        dto.setChapters(chapterDTOs);

        return dto;
    }

    private ChapterDTO mapChapterToDTO(com.cetsheet.backend.Model.Chapter chapter, Long userId) {
        ChapterDTO dto = modelMapper.map(chapter, ChapterDTO.class);
       
        dto.setChapterId(chapter.getChapterId());
        dto.setChapterName(chapter.getChapterName());

        // Determine completion based on user progress if provided
        boolean completedFlag = false;
        boolean revisedFlag = false;
        if (userId != null) {
            completedFlag = progressService.isChapterCompletedForUser(chapter.getChapterId(), userId);
            revisedFlag = progressService.isChapterRevisedForUser(chapter.getChapterId(), userId);
        }
        dto.setCompleted(completedFlag);
        dto.setRevised(revisedFlag);

       
       
        // Set resource availability flags using simple loops
        boolean hasNotes = false;
        boolean hasShortNotes = false;
        boolean hasPyqs = false;
        for (com.cetsheet.backend.Model.Resource resource : chapter.getResources()) {
            if (resource.getType().name().equals("NOTES")) {
                hasNotes = true;
            }
            if (resource.getType().name().equals("SHORT_NOTES")) {
                hasShortNotes = true;
            }
            if (resource.getType().name().equals("PYQS")) {
                hasPyqs = true;
            }
        }

        dto.setHasNotes(hasNotes);
        dto.setHasShortNotes(hasShortNotes);
        dto.setHasPyqs(hasPyqs);

        return dto;
    }
}


