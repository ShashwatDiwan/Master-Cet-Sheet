package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.ChapterProgress;
import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.Model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChapterProgressRepository extends JpaRepository<ChapterProgress, Long> {
    Optional<ChapterProgress> findByUserAndChapter(User user, Chapter chapter);
    List<ChapterProgress> findByUserAndChapter_Sheet_SheetId(User user, int sheetId);
    List<ChapterProgress> findByUser(User user);

    @Query("""
            select cp
            from ChapterProgress cp
            join fetch cp.chapter ch
            left join fetch ch.sheet
            where cp.user.id = :userId
            """)
    List<ChapterProgress> findAllByUserIdWithChapter(@Param("userId") Long userId);

    @Query("""
            select cp
            from ChapterProgress cp
            join fetch cp.chapter ch
            left join fetch ch.sheet
            where cp.user.id = :userId and ch.sheet.sheetId = :sheetId
            """)
    List<ChapterProgress> findAllByUserIdAndSheetIdWithChapter(@Param("userId") Long userId, @Param("sheetId") int sheetId);
}
