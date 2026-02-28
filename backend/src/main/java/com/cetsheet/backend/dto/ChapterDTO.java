package com.cetsheet.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ChapterDTO {
    private int chapterId;
    private String chapterName;
    private boolean Completed = false;
    private boolean Revised = false;
    private double weightage;

    // Resource availability flags for quick UI checks
    private boolean hasNotes = false;
    private boolean hasShortNotes = false;
    private boolean hasPyqs = false;
}
