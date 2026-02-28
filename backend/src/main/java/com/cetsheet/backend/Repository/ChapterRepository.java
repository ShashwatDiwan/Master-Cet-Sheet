package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChapterRepository extends JpaRepository<Chapter,Integer> {
}
