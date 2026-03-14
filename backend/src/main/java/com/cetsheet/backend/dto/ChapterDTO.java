package com.cetsheet.backend.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

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
    private List<ResourceDTO> resources = new ArrayList<>();

    // Resource availability flags for quick UI checks
    private boolean hasNotes = false;
    private boolean hasShortNotes = false;
    private boolean hasPyqs = false;
}
