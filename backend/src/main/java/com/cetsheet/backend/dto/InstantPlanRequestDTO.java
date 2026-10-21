package com.cetsheet.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InstantPlanRequestDTO {

    private Integer sheetId;
    private Boolean includeRevision;
}
