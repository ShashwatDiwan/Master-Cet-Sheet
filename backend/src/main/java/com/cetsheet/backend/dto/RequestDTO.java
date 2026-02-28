package com.cetsheet.backend.dto;

import com.cetsheet.backend.Model.ResourceType;

public class RequestDTO {
    private Integer resourceId;
    private String resourceName;
    private ResourceType resourceType;
    private String driveFileId;
    private String previewUrl; // Computed Google Drive preview URL
}
