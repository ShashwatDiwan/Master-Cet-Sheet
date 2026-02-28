package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.ChapterProgress;
import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.Model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChapterProgressRepository extends JpaRepository<ChapterProgress, Long> {
    Optional<ChapterProgress> findByUserAndChapter(User user, Chapter chapter);
    List<ChapterProgress> findByUserAndChapter_Sheet_SheetId(User user, int sheetId);
    List<ChapterProgress> findByUser(User user);
}