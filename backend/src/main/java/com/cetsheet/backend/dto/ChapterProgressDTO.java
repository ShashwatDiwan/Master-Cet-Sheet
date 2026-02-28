package com.cetsheet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChapterProgressDTO {
    private Long id;
    private int chapterId;
    private int sheetId; // optional for convenience
    private boolean completed;
    private boolean revised;            // per-user field
}