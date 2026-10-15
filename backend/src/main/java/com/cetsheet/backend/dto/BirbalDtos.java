package com.cetsheet.backend.dto;

import java.util.List;

public final class BirbalDtos {
    private BirbalDtos() { }

    public record Concept(String id, String name, String importance, List<Integer> sourcePages, String oneLineSummary) { }

    public record Match(String id, String question, String answer, String type, String difficulty,
                        List<Integer> sourcePages, List<Concept> concepts, double confidence) { }

    public record AskResponse(int chapterId, String chapterName, List<Match> matches) { }

    public record BrowseResponse(int chapterId, String chapterName, List<Concept> concepts, List<Match> qna) { }
}
