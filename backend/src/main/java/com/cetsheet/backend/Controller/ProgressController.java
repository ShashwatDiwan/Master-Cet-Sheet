package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.ProgressService;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.ProgressUpdateDTO;
import com.cetsheet.backend.dto.StatusUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final AuthenticatedUserService authenticatedUserService;

    // Admin / client endpoints that operate on arbitrary userId
    @PatchMapping("/{userId}/{chapterId}")
    public ChapterProgressDTO updateProgressForUser(@PathVariable Long userId,
                                                    @PathVariable int chapterId,
                                                    @RequestBody StatusUpdateDTO status) {
        return progressService.updateProgress(userId, chapterId, status.getCompleted(), status.getRevised());
    }

    @GetMapping("/{userId}")
    public List<ChapterProgressDTO> getProgressByUser(@PathVariable Long userId) {
        return progressService.getProgressByUser(userId);
    }

    // Authenticated user endpoints
    @GetMapping
    public List<ChapterProgressDTO> getAllForCurrentUser() {
        return progressService.getProgressForUser(authenticatedUserService.currentUserId());
    }

    @GetMapping("/sheet/{sheetId}")
    public List<ChapterProgressDTO> getBySheetForCurrentUser(@PathVariable int sheetId) {
        return progressService.getProgressForUserBySheet(authenticatedUserService.currentUserId(), sheetId);
    }

    @PostMapping
    public ChapterProgressDTO upsertForCurrentUser(@RequestBody ProgressUpdateDTO dto) {
        // support passing revised flag as well now that ProgressUpdateDTO carries it
        return progressService.updateProgress(authenticatedUserService.currentUserId(), dto.getChapterId(), dto.getCompleted(), dto.getRevised());
    }
}
