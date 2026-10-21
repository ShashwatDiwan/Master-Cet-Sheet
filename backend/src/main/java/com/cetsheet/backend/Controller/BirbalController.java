package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.BirbalCorpusService;
import com.cetsheet.backend.Services.BirbalRateLimitException;
import com.cetsheet.backend.dto.BirbalDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/resources/{resourceId}/birbal")
@RequiredArgsConstructor
public class BirbalController {
    private final BirbalCorpusService corpusService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/ask")
    public BirbalDtos.AskResponse ask(@PathVariable int resourceId, @RequestParam("q") String query) {
        return corpusService.ask(authenticatedUserService.currentUserId(), resourceId, query);
    }

    @GetMapping("/browse")
    public BirbalDtos.BrowseResponse browse(@PathVariable int resourceId,
                                             @RequestParam(required = false) String type,
                                             @RequestParam(required = false) String difficulty,
                                             @RequestParam(required = false) String concept,
                                             @RequestParam(required = false) Integer page) {
        return corpusService.browse(authenticatedUserService.currentUserId(), resourceId, type, difficulty, concept, page);
    }

    @ExceptionHandler(BirbalRateLimitException.class)
    public ResponseEntity<Void> rateLimited(BirbalRateLimitException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(ex.getRetryAfterSeconds()))
                .build();
    }
}
