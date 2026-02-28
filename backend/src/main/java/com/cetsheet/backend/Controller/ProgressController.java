package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.Services.ProgressService;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.ProgressUpdateDTO;
import com.cetsheet.backend.dto.StatusUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Unauthenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
    }

    private Long currentUserId() {
        return currentUser().getId();
    }

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
        return progressService.getProgressForUser(currentUserId());
    }

    @GetMapping("/sheet/{sheetId}")
    public List<ChapterProgressDTO> getBySheetForCurrentUser(@PathVariable int sheetId) {
        return progressService.getProgressForUserBySheet(currentUserId(), sheetId);
    }

    @PostMapping
    public ChapterProgressDTO upsertForCurrentUser(@RequestBody ProgressUpdateDTO dto) {
        // support passing revised flag as well now that ProgressUpdateDTO carries it
        return progressService.updateProgress(currentUserId(), dto.getChapterId(), dto.getCompleted(), dto.getRevised());
    }
}