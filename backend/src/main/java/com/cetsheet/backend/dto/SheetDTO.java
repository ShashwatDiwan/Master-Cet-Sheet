package com.cetsheet.backend.dto;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SheetDTO {
    private int sheetId;
    private String sheetName;
    private String subject;
    private String description;
    private int totalChapters;
    private int completedChapters;
    private List<ChapterDTO> chapters;
}
