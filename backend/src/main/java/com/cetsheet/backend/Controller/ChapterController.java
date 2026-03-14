package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.ProgressService;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import com.cetsheet.backend.dto.StatusUpdateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ProgressService progressService;
    private final AuthenticatedUserService authenticatedUserService;

    // PATCH endpoint for updating per-user progress (completed/revised)
    @RequestMapping(value = "/{chapterId}/progress", method = RequestMethod.PATCH)
    public ChapterProgressDTO updateProgress(@PathVariable int chapterId, @RequestBody StatusUpdateDTO statusUpdateDTO) {
        Boolean completed = statusUpdateDTO.getCompleted();
        Boolean revised = statusUpdateDTO.getRevised();
        // at least one field should be present; both nullable if caller doesn't want to change
        if (completed == null && revised == null) {
            throw new RuntimeException("At least one of 'completed' or 'revised' must be provided");
        }
        return progressService.updateProgress(authenticatedUserService.currentUserId(), chapterId, completed, revised);
    }
}


