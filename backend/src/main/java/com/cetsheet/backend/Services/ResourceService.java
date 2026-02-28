package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.dto.ResourceDTO;
import com.cetsheet.backend.Model.ResourceType;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {
    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ModelMapper modelMapper;

    public List<ResourceDTO> getResourcesByChapterId(int chapterId) {
        List<Resource> resources = resourceRepository.findByChapter_ChapterId(chapterId);
        List<ResourceDTO> dtos = new ArrayList<>();
        for (Resource r : resources) {
            ResourceDTO dto = new ResourceDTO();
            dto.setResourceId(r.getResourceId());
            dto.setResourceName(r.getResourceName());
            dto.setType(r.getType());
            // Map entity driveFileID -> dto driveFileId, normalizing if a full URL leaked into the DB
            String fileId = extractDriveId(r.getDriveFileID());
            if ((fileId == null || fileId.isEmpty()) && r.getResourceName() != null) {
                // As a fallback, attempt to extract from resourceName if it's a URL
                fileId = extractDriveId(r.getResourceName());
            }
            dto.setDriveFileId(fileId);
            if (fileId != null && !fileId.isEmpty()) {
                dto.setPreviewUrl("https://drive.google.com/file/d/" + fileId + "/preview");
            }
            dtos.add(dto);
        }
        return dtos;
    }

    public List<ResourceDTO> getResourcesByChapterIdAndType(int chapterId, ResourceType type) {
        List<Resource> resources = resourceRepository.findByChapter_ChapterIdAndType(chapterId, type);
        List<ResourceDTO> dtos = new ArrayList<>();
        for (Resource r : resources) {
            ResourceDTO dto = new ResourceDTO();
            dto.setResourceId(r.getResourceId());
            dto.setResourceName(r.getResourceName());
            dto.setType(r.getType());
            String fileId = extractDriveId(r.getDriveFileID());
            if ((fileId == null || fileId.isEmpty()) && r.getResourceName() != null) {
                fileId = extractDriveId(r.getResourceName());
            }
            dto.setDriveFileId(fileId);
            if (fileId != null && !fileId.isEmpty()) {
                dto.setPreviewUrl("https://drive.google.com/file/d/" + fileId + "/preview");
            }
            dtos.add(dto);
        }
        return dtos;
    }

    // Attempt to extract a Google Drive file ID from either a bare ID or various Drive URL formats
    private String extractDriveId(String value) {
        if (value == null || value.isEmpty()) return null;
        String v = value.trim();
        // If it looks like a plain ID (no slashes/spaces), accept it
        if (!v.contains("/") && !v.contains(" ") && v.length() >= 20) {
            return v;
        }
        // Patterns: /file/d/{id}/, ?id={id}
        int dIdx = v.indexOf("/file/d/");
        if (dIdx >= 0) {
            String after = v.substring(dIdx + "/file/d/".length());
            int slash = after.indexOf('/');
            return slash > 0 ? after.substring(0, slash) : after;
        }
        int idParam = v.indexOf("id=");
        if (idParam >= 0) {
            String after = v.substring(idParam + 3);
            int amp = after.indexOf('&');
            return amp > 0 ? after.substring(0, amp) : after;
        }
        return null;
    }
}


