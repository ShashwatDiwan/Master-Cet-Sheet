package com.cetsheet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProgressUpdateDTO {
    private int chapterId;
    private Boolean completed;
    private Boolean revised;          // optional per‑user revised flag
}