package com.cetsheet.backend.Repository;
import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource,Integer> {

    List<Resource> findByChapter_ChapterId(int chapterId);
    List<Resource> findByChapter_ChapterIdAndType(int chapterId, ResourceType type);


}
