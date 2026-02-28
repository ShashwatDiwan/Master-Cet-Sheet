package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.Sheet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SheetRepository extends JpaRepository<Sheet,Integer> {
    Optional<Sheet> findBysheetName(String sheetName);
}
