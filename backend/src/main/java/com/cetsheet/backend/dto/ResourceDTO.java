package com.cetsheet.backend.dto;

import com.cetsheet.backend.Model.ResourceType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ResourceDTO {
    private Integer resourceId;
    private String resourceName;
    private ResourceType type;
    /** Availability only. Object keys and signed URLs are never catalog data. */
    private boolean viewerAvailable;
}

