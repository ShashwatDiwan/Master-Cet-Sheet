package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.Chapter;
import com.cetsheet.backend.Model.ChapterProgress;
import com.cetsheet.backend.Repository.ChapterProgressRepository;
import com.cetsheet.backend.Repository.ChapterRepository;
import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Model.User;
import com.cetsheet.backend.dto.ChapterProgressDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ChapterProgressRepository progressRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;


    public boolean isChapterCompletedForUser(int chapterId, Long userId) {
        if (userId == null) return false;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;
        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        if (chapter == null) return false;
        return progressRepository.findByUserAndChapter(user, chapter)
                .map(ChapterProgress::isCompleted)
                .orElse(false);
    }

    public boolean isChapterRevisedForUser(int chapterId, Long userId) {
        if (userId == null) return false;
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;
        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        if (chapter == null) return false;
        return progressRepository.findByUserAndChapter(user, chapter)
                .map(ChapterProgress::isRevised)
                .orElse(false);
    }

    public List<ChapterProgressDTO> getProgressForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<ChapterProgress> list = progressRepository.findAllByUserIdWithChapter(user.getId());
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    // alias with requested name
    public List<ChapterProgressDTO> getProgressByUser(Long userId) {
        return getProgressForUser(userId);
    }

    // API to update completed/revised for a user+chapter pair
    public ChapterProgressDTO updateProgress(Long userId, int chapterId, Boolean completed, Boolean revised) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found"));

        ChapterProgress progress = progressRepository.findByUserAndChapter(user, chapter)
                .orElse(new ChapterProgress());
        progress.setUser(user);
        progress.setChapter(chapter);
        if (completed != null) {
            progress.setCompleted(completed);
           
        }
        if (revised != null) {
            progress.setRevised(revised);
        }


        ChapterProgress saved = progressRepository.save(progress);
        return toDto(saved, chapter);
    }

    public List<ChapterProgressDTO> getProgressForUserBySheet(Long userId, int sheetId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<ChapterProgress> list = progressRepository.findAllByUserIdAndSheetIdWithChapter(user.getId(), sheetId);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Map<Integer, ChapterProgressDTO> getProgressMapForUser(Long userId) {
        if (userId == null) {
            return Collections.emptyMap();
        }

        return progressRepository.findAllByUserIdWithChapter(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toMap(
                        ChapterProgressDTO::getChapterId,
                        dto -> dto,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    public Map<Integer, ChapterProgressDTO> getProgressMapForUserBySheet(Long userId, int sheetId) {
        if (userId == null) {
            return Collections.emptyMap();
        }

        return progressRepository.findAllByUserIdAndSheetIdWithChapter(userId, sheetId).stream()
                .map(this::toDto)
                .collect(Collectors.toMap(
                        ChapterProgressDTO::getChapterId,
                        dto -> dto,
                        (left, right) -> right,
                        LinkedHashMap::new
                ));
    }

    private ChapterProgressDTO toDto(ChapterProgress p) {
        return ChapterProgressDTO.builder()
                .id(p.getId())
                .chapterId(p.getChapter().getChapterId())
                .sheetId(p.getChapter().getSheet().getSheetId())
                .completed(p.isCompleted())
                .revised(p.isRevised())
                .build();
    }

    private ChapterProgressDTO toDto(ChapterProgress p, Chapter chapter) {
        return ChapterProgressDTO.builder()
                .id(p.getId())
                .chapterId(chapter.getChapterId())
                .sheetId(chapter.getSheet().getSheetId())
                .completed(p.isCompleted())
                .revised(p.isRevised())
                .build();
    }
}
