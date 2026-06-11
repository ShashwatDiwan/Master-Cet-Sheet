package com.cetsheet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanMyDayResponseDTO {

    private String planDate;
    private String timezone;
    private int totalStudyMinutes;
    private int totalBreakMinutes;
    private String summary;
    private boolean fallbackUsed;
    private int estimatedPromptTokens;
    private int estimatedCompletionTokens;

    @Builder.Default
    private List<StudyBlockDTO> blocks = new ArrayList<>();

    @Builder.Default
    private List<FocusChapterDTO> focusChapters = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudyBlockDTO {
        private int order;
        private String startTime;
        private String endTime;
        private int durationMinutes;
        private int chapterId;
        private String chapterName;
        private String sheetName;
        private String subject;
        private boolean revision;
        private String reason;
        private double priorityScore;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FocusChapterDTO {
        private int chapterId;
        private String chapterName;
        private String sheetName;
        private String subject;
        private double weightage;
        private boolean completed;
        private boolean revised;
        private double priorityScore;
    }
}