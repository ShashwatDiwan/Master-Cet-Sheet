package com.cetsheet.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomizedPlanRequestDTO {

    private Integer sheetId;

    @Min(value = 30, message = "availableMinutes must be at least 30")
    @Max(value = 720, message = "availableMinutes cannot exceed 720")
    private Integer availableMinutes;

    @Min(value = 1, message = "availableHours must be at least 1")
    @Max(value = 12, message = "availableHours cannot exceed 12")
    private Integer availableHours;

    @Min(value = 20, message = "maxSessionMinutes must be at least 20")
    @Max(value = 180, message = "maxSessionMinutes cannot exceed 180")
    private Integer maxSessionMinutes;

    @Min(value = 0, message = "breakMinutes cannot be negative")
    @Max(value = 30, message = "breakMinutes cannot exceed 30")
    private Integer breakMinutes;

    @Pattern(
            regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
            message = "preferredStartTime must use HH:mm format"
    )
    private String preferredStartTime;

    private Boolean includeRevision;
    private PlanDayType dayType;

    @Size(max = 500, message = "customMessage must be <= 500 chars")
    private String customMessage;
}
