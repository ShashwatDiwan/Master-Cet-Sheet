package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Services.ProgressService;
import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.dto.StatusUpdateDTO;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found: " + auth.getName()));
    }

    // PATCH endpoint for updating per-user progress (completed/revised)
    @RequestMapping(value = "/{chapterId}/progress", method = RequestMethod.PATCH)
    public ChapterProgressDTO updateProgress(@PathVariable int chapterId, @RequestBody StatusUpdateDTO statusUpdateDTO) {
        Boolean completed = statusUpdateDTO.getCompleted();
        Boolean revised = statusUpdateDTO.getRevised();
        // at least one field should be present; both nullable if caller doesn't want to change
        if (completed == null && revised == null) {
            throw new RuntimeException("At least one of 'completed' or 'revised' must be provided");
        }
        return progressService.updateProgress(currentUserId(), chapterId, completed, revised);
    }
}


