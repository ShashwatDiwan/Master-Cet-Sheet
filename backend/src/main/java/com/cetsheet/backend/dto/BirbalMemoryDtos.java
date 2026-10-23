package com.cetsheet.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class BirbalMemoryDtos {
    private BirbalMemoryDtos() { }

    public record Profile(String globalSummary, String physicsSummary, String chemistrySummary,
                          String mathematicsSummary, Instant updatedAt) { }

    public record ProfileUpdateRequest(String globalSummary, String physicsSummary, String chemistrySummary,
                                       String mathematicsSummary) { }

    public record RecentTest(String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore,
                             BigDecimal percentage) { }

    public record WeakChapter(String name, long mistakeCount) { }

    public record WeakConcept(String chapterName, String conceptName, int mistakeCount,
                              String topReason, BigDecimal weaknessScore, LocalDate lastMistakeOn) { }

    public record ReasonPattern(String reason, long mistakeCount) { }

    public record SubjectSnapshot(String subject, long totalChapters, long completedChapters, long revisedChapters,
                                  List<WeakChapter> weakChapters, List<WeakConcept> weakConcepts,
                                  List<ReasonPattern> reasonPatterns) { }

    public record SubjectContext(String subject, String prompt) { }

    public record MemoryResponse(Profile profile, List<SubjectSnapshot> subjects, List<RecentTest> recentTests,
                                 String externalPrompt, List<SubjectContext> subjectContexts) { }
}
