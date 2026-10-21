package com.cetsheet.backend.dto;

import com.cetsheet.backend.Model.MistakeReason;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class LogbookDtos {
    private LogbookDtos() { }

    public record Concept(int chapterId, String id, String name, List<Integer> sourcePages) { }
    public record CatalogChapter(int id, String name, String subject, int sourceResourceId, List<Concept> concepts) { }
    public record CatalogResponse(List<CatalogChapter> chapters) { }

    public record TestUpsertRequest(String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore,
                                    List<Integer> chapterIds) { }
    public record TestSummary(UUID id, String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore,
                              BigDecimal percentage) { }
    public record TestDetail(UUID id, String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore,
                             List<Integer> chapterIds, List<Mistake> mistakes) { }

    public record MistakeUpsertRequest(Integer chapterId, String conceptId, MistakeReason reason, String note) { }
    public record Mistake(UUID id, int chapterId, String conceptId, String conceptName, MistakeReason reason,
                          String note, LocalDate testDate) { }

    public record RepeatInsight(int chapterId, String conceptId, String conceptName, int mistakeCount,
                                LocalDate lastMistakeOn, MistakeReason topReason, BigDecimal weaknessScore,
                                int sourceResourceId, List<Integer> sourcePages) { }
    public record ReasonBreakdown(String subject, MistakeReason reason, long count) { }
}
