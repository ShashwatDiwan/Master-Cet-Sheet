package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.Sheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SheetRepository extends JpaRepository<Sheet,Integer> {
    Optional<Sheet> findBysheetName(String sheetName);

    @Query("select distinct s from Sheet s left join fetch s.chapters")
    List<Sheet> findAllWithChapters();

    @Query("select distinct s from Sheet s left join fetch s.chapters where s.sheetId = :sheetId")
    Optional<Sheet> findByIdWithChapters(@Param("sheetId") int sheetId);

    @Query("select distinct s from Sheet s left join fetch s.chapters where s.sheetName = :sheetName")
    Optional<Sheet> findBySheetNameWithChapters(@Param("sheetName") String sheetName);
}
