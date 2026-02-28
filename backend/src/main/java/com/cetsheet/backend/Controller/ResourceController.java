package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Services.ResourceService;
import com.cetsheet.backend.Model.ResourceType;
import com.cetsheet.backend.dto.ResourceDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chapters/{chapterId}/resources")
public class ResourceController {
    @Autowired
    private ResourceService resourceService;

    @GetMapping("")
    public List<ResourceDTO> getResourcesByChapter(@PathVariable int chapterId,
                                                   @RequestParam(value = "type", required = false) ResourceType type) {
        if (type != null) {
            return resourceService.getResourcesByChapterIdAndType(chapterId, type);
        } else {
            return resourceService.getResourcesByChapterId(chapterId);
        }
    }
}
