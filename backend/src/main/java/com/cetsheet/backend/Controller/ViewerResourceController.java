package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.ViewerUrlRateLimitException;
import com.cetsheet.backend.Services.ViewerUrlService;
import com.cetsheet.backend.dto.ViewerUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ViewerResourceController {
    private final ViewerUrlService viewerUrlService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/{resourceId}/viewer-url")
    public ViewerUrlResponse getViewerUrl(@PathVariable int resourceId) {
        return viewerUrlService.issue(authenticatedUserService.currentUserId(), resourceId);
    }

    @ExceptionHandler(ViewerUrlRateLimitException.class)
    public ResponseEntity<Void> handleRateLimit(ViewerUrlRateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(ex.getRetryAfterSeconds()))
                .build();
    }
}
