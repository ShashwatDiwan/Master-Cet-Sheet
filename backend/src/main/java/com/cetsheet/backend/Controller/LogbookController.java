package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.LogbookService;
import com.cetsheet.backend.dto.LogbookDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/logbook")
@RequiredArgsConstructor
public class LogbookController {
    private final LogbookService logbookService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/catalog")
    public LogbookDtos.CatalogResponse catalog() { return logbookService.catalog(); }

    @PostMapping("/tests")
    @ResponseStatus(HttpStatus.CREATED)
    public LogbookDtos.TestDetail createTest(@RequestBody LogbookDtos.TestUpsertRequest request) {
        return logbookService.createTest(authenticatedUserService.currentUserId(), request);
    }

    @GetMapping("/tests")
    public List<LogbookDtos.TestSummary> listTests() { return logbookService.listTests(authenticatedUserService.currentUserId()); }

    @GetMapping("/tests/{testId}")
    public LogbookDtos.TestDetail test(@PathVariable UUID testId) { return logbookService.getTest(authenticatedUserService.currentUserId(), testId); }

    @PatchMapping("/tests/{testId}")
    public LogbookDtos.TestDetail updateTest(@PathVariable UUID testId, @RequestBody LogbookDtos.TestUpsertRequest request) {
        return logbookService.updateTest(authenticatedUserService.currentUserId(), testId, request);
    }

    @DeleteMapping("/tests/{testId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTest(@PathVariable UUID testId) { logbookService.deleteTest(authenticatedUserService.currentUserId(), testId); }

    @PostMapping("/tests/{testId}/mistakes")
    @ResponseStatus(HttpStatus.CREATED)
    public LogbookDtos.Mistake createMistake(@PathVariable UUID testId, @RequestBody LogbookDtos.MistakeUpsertRequest request) {
        return logbookService.createMistake(authenticatedUserService.currentUserId(), testId, request);
    }

    @PatchMapping("/mistakes/{mistakeId}")
    public LogbookDtos.Mistake updateMistake(@PathVariable UUID mistakeId, @RequestBody LogbookDtos.MistakeUpsertRequest request) {
        return logbookService.updateMistake(authenticatedUserService.currentUserId(), mistakeId, request);
    }

    @DeleteMapping("/mistakes/{mistakeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMistake(@PathVariable UUID mistakeId) { logbookService.deleteMistake(authenticatedUserService.currentUserId(), mistakeId); }

    @GetMapping("/insights/repeats")
    public List<LogbookDtos.RepeatInsight> repeats() { return logbookService.repeats(authenticatedUserService.currentUserId()); }

    @GetMapping("/insights/reasons")
    public List<LogbookDtos.ReasonBreakdown> reasons() { return logbookService.reasonBreakdown(authenticatedUserService.currentUserId()); }
}
