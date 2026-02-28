package com.cetsheet.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class StatusUpdateDTO {
    private int chapterId;

    @JsonAlias({"isCompleted"})
    private Boolean completed;

    @JsonAlias({"isRevised"})
    private Boolean revised;
}
