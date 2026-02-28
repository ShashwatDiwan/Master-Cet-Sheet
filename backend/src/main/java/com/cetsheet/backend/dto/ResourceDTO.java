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
    private String driveFileId;
    private String previewUrl; // Computed Google Drive preview URL
}

