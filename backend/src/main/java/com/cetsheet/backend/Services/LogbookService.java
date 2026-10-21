package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.MistakeReason;
import com.cetsheet.backend.dto.LogbookDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Owns all authenticated reads and writes for the Prepilot mistake logbook. */
@Service
@RequiredArgsConstructor
public class LogbookService {
    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public LogbookDtos.CatalogResponse catalog() {
        Map<Integer, CatalogChapterBuilder> chapters = new LinkedHashMap<>();
        jdbc.query("""
                SELECT cc.chapter_id, cc.chapter_name, cc.subject, cc.source_resource_id,
                       c.concept_id, c.concept_name, c.source_pages
                FROM corpus_chapter cc
                JOIN corpus_concept c ON c.chapter_id = cc.chapter_id
                WHERE cc.source_resource_id IS NOT NULL
                ORDER BY cc.subject, cc.chapter_name, c.concept_name
                """, (rs, ignored) -> {
            int chapterId = rs.getInt("chapter_id");
            String chapterName = rs.getString("chapter_name");
            String subject = rs.getString("subject");
            int sourceResourceId = rs.getInt("source_resource_id");
            CatalogChapterBuilder chapter = chapters.computeIfAbsent(chapterId, ignoredId ->
                    new CatalogChapterBuilder(chapterId, chapterName, subject, sourceResourceId));
            chapter.concepts.add(new LogbookDtos.Concept(chapterId, rs.getString("concept_id"),
                    rs.getString("concept_name"), integers(rs.getArray("source_pages"))));
            return null;
        });
        return new LogbookDtos.CatalogResponse(chapters.values().stream().map(CatalogChapterBuilder::build).toList());
    }

    @Transactional
    public LogbookDtos.TestDetail createTest(long userId, LogbookDtos.TestUpsertRequest request) {
        ValidTest valid = validateTestRequest(userId, request, null);
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO student_tests (id, user_id, name, test_date, score, max_score)
                VALUES (:id, :userId, :name, :testDate, :score, :maxScore)
                """, testParams(id, userId, valid));
        insertChapters(id, valid.chapterIds());
        return getTest(userId, id);
    }

    @Transactional(readOnly = true)
    public List<LogbookDtos.TestSummary> listTests(long userId) {
        return jdbc.query("""
                SELECT id, name, test_date, score, max_score,
                       ROUND((score * 100.0 / max_score), 2) AS percentage
                FROM student_tests WHERE user_id = :userId
                ORDER BY test_date, created_at
                """, Map.of("userId", userId), (rs, ignored) -> new LogbookDtos.TestSummary(
                uuid(rs, "id"), rs.getString("name"), rs.getObject("test_date", LocalDate.class),
                rs.getBigDecimal("score"), rs.getBigDecimal("max_score"), rs.getBigDecimal("percentage")));
    }

    @Transactional(readOnly = true)
    public LogbookDtos.TestDetail getTest(long userId, UUID testId) {
        TestRecord test = ownedTest(userId, testId);
        List<Integer> chapterIds = jdbc.query("""
                SELECT chapter_id FROM student_test_chapters WHERE test_id = :testId ORDER BY chapter_id
                """, Map.of("testId", testId), (rs, ignored) -> rs.getInt(1));
        List<LogbookDtos.Mistake> mistakes = jdbc.query("""
                SELECT m.id, m.chapter_id, m.concept_id, COALESCE(c.concept_name, m.concept_id) AS concept_name,
                       m.reason, m.note, t.test_date
                FROM student_mistakes m
                JOIN student_tests t ON t.id = m.test_id
                LEFT JOIN corpus_concept c ON c.chapter_id = m.chapter_id AND c.concept_id = m.concept_id
                WHERE m.test_id = :testId AND m.user_id = :userId
                ORDER BY m.created_at
                """, Map.of("testId", testId, "userId", userId), this::mistakeRow);
        return new LogbookDtos.TestDetail(test.id(), test.name(), test.testDate(), test.score(), test.maxScore(), chapterIds, mistakes);
    }

    @Transactional
    public LogbookDtos.TestDetail updateTest(long userId, UUID testId, LogbookDtos.TestUpsertRequest request) {
        ownedTest(userId, testId);
        ValidTest valid = validateTestRequest(userId, request, testId);
        Integer invalidMistakes = jdbc.queryForObject("""
                SELECT count(*) FROM student_mistakes
                WHERE test_id = :testId AND user_id = :userId AND chapter_id NOT IN (:chapterIds)
                """, new MapSqlParameterSource("testId", testId).addValue("userId", userId)
                .addValue("chapterIds", valid.chapterIds()), Integer.class);
        if (invalidMistakes != null && invalidMistakes > 0) {
            throw badRequest("Keep every chapter that has a logged wrong question, or edit those mistakes first.");
        }
        jdbc.update("""
                UPDATE student_tests SET name = :name, test_date = :testDate, score = :score,
                    max_score = :maxScore, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND user_id = :userId
                """, testParams(testId, userId, valid));
        jdbc.update("DELETE FROM student_test_chapters WHERE test_id = :testId", Map.of("testId", testId));
        insertChapters(testId, valid.chapterIds());
        rebuildTestConcepts(userId, testId);
        return getTest(userId, testId);
    }

    @Transactional
    public void deleteTest(long userId, UUID testId) {
        ownedTest(userId, testId);
        List<ConceptKey> affected = conceptsForTest(userId, testId);
        jdbc.update("DELETE FROM student_tests WHERE id = :testId AND user_id = :userId", Map.of("testId", testId, "userId", userId));
        affected.forEach(key -> rebuildConceptState(userId, key));
    }

    @Transactional
    public LogbookDtos.Mistake createMistake(long userId, UUID testId, LogbookDtos.MistakeUpsertRequest request) {
        ownedTest(userId, testId);
        ValidMistake valid = validateMistake(userId, testId, request);
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO student_mistakes (id, user_id, test_id, chapter_id, concept_id, reason, note)
                VALUES (:id, :userId, :testId, :chapterId, :conceptId, :reason, :note)
                """, mistakeParams(id, userId, testId, valid));
        rebuildConceptState(userId, valid.key());
        return mistake(userId, id);
    }

    @Transactional
    public LogbookDtos.Mistake updateMistake(long userId, UUID mistakeId, LogbookDtos.MistakeUpsertRequest request) {
        MistakeRecord existing = ownedMistake(userId, mistakeId);
        ValidMistake valid = validateMistake(userId, existing.testId(), request);
        jdbc.update("""
                UPDATE student_mistakes SET chapter_id = :chapterId, concept_id = :conceptId, reason = :reason,
                    note = :note, updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND user_id = :userId
                """, mistakeParams(mistakeId, userId, existing.testId(), valid));
        rebuildConceptState(userId, existing.key());
        rebuildConceptState(userId, valid.key());
        return mistake(userId, mistakeId);
    }

    @Transactional
    public void deleteMistake(long userId, UUID mistakeId) {
        MistakeRecord existing = ownedMistake(userId, mistakeId);
        jdbc.update("DELETE FROM student_mistakes WHERE id = :id AND user_id = :userId", Map.of("id", mistakeId, "userId", userId));
        rebuildConceptState(userId, existing.key());
    }

    @Transactional(readOnly = true)
    public List<LogbookDtos.RepeatInsight> repeats(long userId) {
        return jdbc.query("""
                SELECT s.chapter_id, s.concept_id, c.concept_name, s.mistake_count, s.last_mistake_on,
                       s.top_reason, s.weakness_score, cc.source_resource_id, c.source_pages
                FROM concept_state s
                JOIN corpus_concept c ON c.chapter_id = s.chapter_id AND c.concept_id = s.concept_id
                JOIN corpus_chapter cc ON cc.chapter_id = s.chapter_id
                WHERE s.user_id = :userId AND s.mistake_count >= 2 AND cc.source_resource_id IS NOT NULL
                ORDER BY s.mistake_count DESC, s.last_mistake_on DESC, s.weakness_score DESC
                """, Map.of("userId", userId), (rs, ignored) -> new LogbookDtos.RepeatInsight(
                rs.getInt("chapter_id"), rs.getString("concept_id"), rs.getString("concept_name"),
                rs.getInt("mistake_count"), rs.getObject("last_mistake_on", LocalDate.class),
                MistakeReason.valueOf(rs.getString("top_reason")), rs.getBigDecimal("weakness_score"),
                rs.getInt("source_resource_id"), integers(rs.getArray("source_pages"))));
    }

    @Transactional(readOnly = true)
    public List<LogbookDtos.ReasonBreakdown> reasonBreakdown(long userId) {
        return jdbc.query("""
                SELECT sh.subject, m.reason, count(*) AS total
                FROM student_mistakes m
                JOIN chapter c ON c.chapter_id = m.chapter_id
                JOIN sheet sh ON sh.sheet_id = c.sheet_id
                WHERE m.user_id = :userId
                GROUP BY sh.subject, m.reason
                ORDER BY sh.subject, m.reason
                """, Map.of("userId", userId), (rs, ignored) -> new LogbookDtos.ReasonBreakdown(
                rs.getString("subject"), MistakeReason.valueOf(rs.getString("reason")), rs.getLong("total")));
    }

    private ValidTest validateTestRequest(long userId, LogbookDtos.TestUpsertRequest request, UUID existingId) {
        if (request == null || request.testDate() == null || request.score() == null || request.maxScore() == null) {
            throw badRequest("Name, date, score, and total score are required.");
        }
        if (request.testDate().isAfter(LocalDate.now())) throw badRequest("A school test cannot be dated in the future.");
        if (request.score().signum() < 0 || request.maxScore().signum() <= 0 || request.score().compareTo(request.maxScore()) > 0) {
            throw badRequest("Score must be between zero and the total score.");
        }
        List<Integer> chapterIds = distinctPositive(request.chapterIds());
        if (chapterIds.isEmpty()) throw badRequest("Choose at least one covered chapter.");
        Integer knownChapters = jdbc.queryForObject("SELECT count(*) FROM chapter WHERE chapter_id IN (:chapterIds)",
                new MapSqlParameterSource("chapterIds", chapterIds), Integer.class);
        if (knownChapters == null || knownChapters != chapterIds.size()) throw badRequest("One or more selected chapters do not exist.");
        String name = clean(request.name());
        if (name == null) {
            Integer count = jdbc.queryForObject("SELECT count(*) FROM student_tests WHERE user_id = :userId",
                    Map.of("userId", userId), Integer.class);
            name = "Test " + ((count == null ? 0 : count) + 1);
        }
        if (name.length() > 120) throw badRequest("Test name must be at most 120 characters.");
        return new ValidTest(name, request.testDate(), request.score(), request.maxScore(), chapterIds);
    }

    private ValidMistake validateMistake(long userId, UUID testId, LogbookDtos.MistakeUpsertRequest request) {
        if (request == null || request.chapterId() == null || clean(request.conceptId()) == null || request.reason() == null) {
            throw badRequest("Chapter, concept, and reason are required for every mistake.");
        }
        boolean covered = exists("SELECT EXISTS (SELECT 1 FROM student_test_chapters WHERE test_id = :testId AND chapter_id = :chapterId)",
                Map.of("testId", testId, "chapterId", request.chapterId()));
        if (!covered) throw badRequest("Choose a chapter covered by this test.");
        String conceptId = clean(request.conceptId());
        boolean knownConcept = exists("SELECT EXISTS (SELECT 1 FROM corpus_concept WHERE chapter_id = :chapterId AND concept_id = :conceptId)",
                Map.of("chapterId", request.chapterId(), "conceptId", conceptId));
        if (!knownConcept) throw badRequest("Choose a concept from BirBal's prepared study list.");
        String note = clean(request.note());
        if (note != null && note.length() > 280) throw badRequest("A mistake note must be at most 280 characters.");
        return new ValidMistake(request.chapterId(), conceptId, request.reason(), note);
    }

    private void insertChapters(UUID testId, Collection<Integer> chapterIds) {
        for (Integer chapterId : chapterIds) {
            jdbc.update("INSERT INTO student_test_chapters (test_id, chapter_id) VALUES (:testId, :chapterId)",
                    Map.of("testId", testId, "chapterId", chapterId));
        }
    }

    private void rebuildTestConcepts(long userId, UUID testId) {
        conceptsForTest(userId, testId).forEach(key -> rebuildConceptState(userId, key));
    }

    /** Rebuilds one derived row exclusively from immutable mistake facts. */
    private void rebuildConceptState(long userId, ConceptKey key) {
        Map<String, Object> params = Map.of("userId", userId, "chapterId", key.chapterId(), "conceptId", key.conceptId());
        Rollup rollup = jdbc.query("""
                SELECT count(*) AS mistake_count, max(t.test_date) AS last_mistake_on,
                       COALESCE(sum(CASE
                           WHEN t.test_date >= CURRENT_DATE - 30 THEN 1.0
                           WHEN t.test_date >= CURRENT_DATE - 90 THEN 0.6
                           ELSE 0.3 END), 0) AS weakness_score
                FROM student_mistakes m
                JOIN student_tests t ON t.id = m.test_id
                WHERE m.user_id = :userId AND m.chapter_id = :chapterId AND m.concept_id = :conceptId
                """, params, (rs, ignored) -> new Rollup(rs.getInt("mistake_count"),
                rs.getObject("last_mistake_on", LocalDate.class), rs.getBigDecimal("weakness_score"))).get(0);
        if (rollup.count() == 0) {
            jdbc.update("DELETE FROM concept_state WHERE user_id = :userId AND chapter_id = :chapterId AND concept_id = :conceptId", params);
            return;
        }
        String topReason = jdbc.queryForObject("""
                SELECT m.reason FROM student_mistakes m JOIN student_tests t ON t.id = m.test_id
                WHERE m.user_id = :userId AND m.chapter_id = :chapterId AND m.concept_id = :conceptId
                GROUP BY m.reason ORDER BY count(*) DESC, max(t.test_date) DESC, m.reason ASC LIMIT 1
                """, params, String.class);
        jdbc.update("""
                INSERT INTO concept_state (user_id, chapter_id, concept_id, mistake_count, last_mistake_on, top_reason, weakness_score)
                VALUES (:userId, :chapterId, :conceptId, :count, :lastMistakeOn, :topReason, :weaknessScore)
                ON CONFLICT (user_id, chapter_id, concept_id) DO UPDATE SET
                    mistake_count = EXCLUDED.mistake_count, last_mistake_on = EXCLUDED.last_mistake_on,
                    top_reason = EXCLUDED.top_reason, weakness_score = EXCLUDED.weakness_score,
                    updated_at = CURRENT_TIMESTAMP
                """, new MapSqlParameterSource(params).addValue("count", rollup.count())
                .addValue("lastMistakeOn", rollup.lastMistakeOn()).addValue("topReason", topReason)
                .addValue("weaknessScore", rollup.weaknessScore()));
    }

    private List<ConceptKey> conceptsForTest(long userId, UUID testId) {
        return jdbc.query("""
                SELECT DISTINCT chapter_id, concept_id FROM student_mistakes
                WHERE user_id = :userId AND test_id = :testId
                """, Map.of("userId", userId, "testId", testId),
                (rs, ignored) -> new ConceptKey(rs.getInt("chapter_id"), rs.getString("concept_id")));
    }

    private TestRecord ownedTest(long userId, UUID testId) {
        List<TestRecord> tests = jdbc.query("""
                SELECT id, name, test_date, score, max_score FROM student_tests WHERE id = :id AND user_id = :userId
                """, Map.of("id", testId, "userId", userId), (rs, ignored) -> new TestRecord(uuid(rs, "id"),
                rs.getString("name"), rs.getObject("test_date", LocalDate.class), rs.getBigDecimal("score"), rs.getBigDecimal("max_score")));
        if (tests.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found");
        return tests.get(0);
    }

    private MistakeRecord ownedMistake(long userId, UUID mistakeId) {
        List<MistakeRecord> mistakes = jdbc.query("""
                SELECT id, test_id, chapter_id, concept_id FROM student_mistakes WHERE id = :id AND user_id = :userId
                """, Map.of("id", mistakeId, "userId", userId), (rs, ignored) -> new MistakeRecord(uuid(rs, "id"),
                uuid(rs, "test_id"), new ConceptKey(rs.getInt("chapter_id"), rs.getString("concept_id"))));
        if (mistakes.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mistake not found");
        return mistakes.get(0);
    }

    private LogbookDtos.Mistake mistake(long userId, UUID id) {
        List<LogbookDtos.Mistake> mistakes = jdbc.query("""
                SELECT m.id, m.chapter_id, m.concept_id, COALESCE(c.concept_name, m.concept_id) AS concept_name,
                       m.reason, m.note, t.test_date
                FROM student_mistakes m JOIN student_tests t ON t.id = m.test_id
                LEFT JOIN corpus_concept c ON c.chapter_id = m.chapter_id AND c.concept_id = m.concept_id
                WHERE m.id = :id AND m.user_id = :userId
                """, Map.of("id", id, "userId", userId), this::mistakeRow);
        if (mistakes.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mistake not found");
        return mistakes.get(0);
    }

    private LogbookDtos.Mistake mistakeRow(ResultSet rs, int ignored) throws SQLException {
        return new LogbookDtos.Mistake(uuid(rs, "id"), rs.getInt("chapter_id"), rs.getString("concept_id"),
                rs.getString("concept_name"), MistakeReason.valueOf(rs.getString("reason")), rs.getString("note"),
                rs.getObject("test_date", LocalDate.class));
    }

    private MapSqlParameterSource testParams(UUID id, long userId, ValidTest test) {
        return new MapSqlParameterSource("id", id).addValue("userId", userId).addValue("name", test.name())
                .addValue("testDate", test.testDate()).addValue("score", test.score()).addValue("maxScore", test.maxScore());
    }

    private MapSqlParameterSource mistakeParams(UUID id, long userId, UUID testId, ValidMistake mistake) {
        return new MapSqlParameterSource("id", id).addValue("userId", userId).addValue("testId", testId)
                .addValue("chapterId", mistake.chapterId()).addValue("conceptId", mistake.conceptId())
                .addValue("reason", mistake.reason().name()).addValue("note", mistake.note());
    }

    private boolean exists(String sql, Map<String, ?> params) {
        return Boolean.TRUE.equals(jdbc.queryForObject(sql, params, Boolean.class));
    }

    private static List<Integer> distinctPositive(List<Integer> ids) {
        if (ids == null) return List.of();
        return ids.stream().filter(id -> id != null && id > 0).distinct().sorted().toList();
    }

    private static String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static UUID uuid(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value instanceof UUID id ? id : UUID.fromString(String.valueOf(value));
    }

    private static List<Integer> integers(Array array) throws SQLException {
        if (array == null || !(array.getArray() instanceof Object[] values)) return List.of();
        List<Integer> result = new ArrayList<>();
        for (Object value : values) if (value instanceof Number number) result.add(number.intValue());
        return result;
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record CatalogChapterBuilder(int id, String name, String subject, int sourceResourceId,
                                         List<LogbookDtos.Concept> concepts) {
        CatalogChapterBuilder(int id, String name, String subject, int sourceResourceId) {
            this(id, name, subject, sourceResourceId, new ArrayList<>());
        }
        LogbookDtos.CatalogChapter build() { return new LogbookDtos.CatalogChapter(id, name, subject, sourceResourceId, List.copyOf(concepts)); }
    }
    private record ValidTest(String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore, List<Integer> chapterIds) { }
    private record ValidMistake(int chapterId, String conceptId, MistakeReason reason, String note) {
        ConceptKey key() { return new ConceptKey(chapterId, conceptId); }
    }
    private record TestRecord(UUID id, String name, LocalDate testDate, BigDecimal score, BigDecimal maxScore) { }
    private record MistakeRecord(UUID id, UUID testId, ConceptKey key) { }
    private record ConceptKey(int chapterId, String conceptId) { }
    private record Rollup(int count, LocalDate lastMistakeOn, BigDecimal weaknessScore) { }
}
