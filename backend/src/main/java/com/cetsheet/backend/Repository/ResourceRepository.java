package com.cetsheet.backend.Repository;
import com.cetsheet.backend.Model.Resource;
import com.cetsheet.backend.Model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource,Integer> {

    List<Resource> findByChapter_ChapterId(int chapterId);
    List<Resource> findByChapter_ChapterIdAndType(int chapterId, ResourceType type);
    @Query("select r from Resource r join fetch r.chapter where r.chapter.chapterId in :chapterIds")
    List<Resource> findByChapterIds(@Param("chapterIds") Collection<Integer> chapterIds);


}
