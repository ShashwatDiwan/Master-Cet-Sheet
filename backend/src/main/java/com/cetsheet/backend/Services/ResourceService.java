package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Repository.ResourceRepository;
import com.cetsheet.backend.Repository.ResourceFileRepository;
import com.cetsheet.backend.dto.ResourceDTO;
import com.cetsheet.backend.Model.ResourceType;
import com.cetsheet.backend.mapper.SheetProgressMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {
    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private SheetProgressMapper sheetProgressMapper;

    @Autowired
    private ResourceFileRepository resourceFileRepository;

    public List<ResourceDTO> getResourcesByChapterId(int chapterId) {
        List<Resource> resources = resourceRepository.findByChapter_ChapterId(chapterId);
        return toDtos(resources);
    }

    public List<ResourceDTO> getResourcesByChapterIdAndType(int chapterId, ResourceType type) {
        List<Resource> resources = resourceRepository.findByChapter_ChapterIdAndType(chapterId, type);
        return toDtos(resources);
    }

    public List<ResourceDTO> toDtos(List<Resource> resources) {
        List<ResourceDTO> dtos = new ArrayList<>();
        for (Resource r : resources) {
            dtos.add(toDto(r));
        }
        return dtos;
    }

    public ResourceDTO toDto(Resource r) {
        ResourceDTO dto = sheetProgressMapper.toResourceDto(r);
        dto.setViewerAvailable(resourceFileRepository.existsById(r.getResourceId()));
        return dto;
    }
}


