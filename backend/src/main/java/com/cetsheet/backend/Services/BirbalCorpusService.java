package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.BirbalDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/** Search and browse over imported chapter JSON only. This service makes no LLM calls. */
@Service
@RequiredArgsConstructor
public class BirbalCorpusService {
    private static final int SEARCH_LIMIT = 3;
    private static final int BROWSE_LIMIT = 200;
    private static final long QUERY_LIMIT = 40;
    private static final Duration QUERY_WINDOW = Duration.ofMinutes(1);

    private final NamedParameterJdbcTemplate jdbc;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    public BirbalDtos.AskResponse ask(long userId, int resourceId, String query) {
        String cleanQuery = requireQuery(query);
        Scope scope = scope(resourceId);
        consumeQuota(userId);

        List<RawMatch> rawMatches = jdbc.query("""
                WITH searched AS (SELECT websearch_to_tsquery('english', :query) AS terms)
                SELECT q.chapter_id, q.qna_id, q.question, q.answer, q.type, q.difficulty, q.source_pages,
                       LEAST(1.0, GREATEST(
                           CASE WHEN q.search_document @@ searched.terms
                                THEN 0.55 + LEAST(0.35, ts_rank_cd(q.search_document, searched.terms))
                                ELSE 0 END,
                           similarity(q.search_text, :query) * 0.90
                       )) AS confidence
                FROM corpus_qna q CROSS JOIN searched
                WHERE q.chapter_id = :chapterId
                  AND (q.search_document @@ searched.terms OR similarity(q.search_text, :query) >= 0.12)
                ORDER BY confidence DESC, q.qna_id
                LIMIT %d
                """.formatted(SEARCH_LIMIT), parameters(scope, cleanQuery), this::rawMatchRow);
        List<BirbalDtos.Match> matches = rawMatches.stream().map(this::toMatch).toList();

        if (matches.isEmpty()) {
            audit(userId, resourceId, scope.chapterId(), cleanQuery, null, null, "NO_MATCH");
        } else {
            matches.forEach(match -> audit(userId, resourceId, scope.chapterId(), cleanQuery,
                    match.id(), match.confidence(), "MATCH"));
        }
        return new BirbalDtos.AskResponse(scope.chapterId(), scope.chapterName(), matches);
    }

    public BirbalDtos.BrowseResponse browse(long userId, int resourceId, String type, String difficulty,
                                             String conceptId, Integer page) {
        Scope scope = scope(resourceId);
        consumeQuota(userId);
        MapSqlParameterSource params = parameters(scope, null)
                // PostgreSQL cannot infer a type for an untyped null in an
                // expression such as ':type IS NULL'. Explicit types keep
                // optional Browse filters valid when the UI leaves them blank.
                .addValue("type", blankToNull(type), Types.VARCHAR)
                .addValue("difficulty", blankToNull(difficulty), Types.VARCHAR)
                .addValue("conceptId", blankToNull(conceptId), Types.VARCHAR)
                .addValue("page", page, Types.INTEGER);

        List<BirbalDtos.Concept> concepts = jdbc.query("""
                SELECT concept_id, concept_name, importance, source_pages, one_line_summary
                FROM corpus_concept WHERE chapter_id = :chapterId ORDER BY concept_name
                """, params, this::conceptRow);
        List<RawMatch> rawQna = jdbc.query("""
                SELECT q.chapter_id, q.qna_id, q.question, q.answer, q.type, q.difficulty, q.source_pages,
                       1.0 AS confidence
                FROM corpus_qna q
                WHERE q.chapter_id = :chapterId
                  AND (:type IS NULL OR lower(q.type) = lower(:type))
                  AND (:difficulty IS NULL OR lower(q.difficulty) = lower(:difficulty))
                  AND (:page IS NULL OR q.source_pages @> ARRAY[:page]::integer[])
                  AND (:conceptId IS NULL OR EXISTS (
                      SELECT 1 FROM corpus_qna_concept qc
                      WHERE qc.chapter_id = q.chapter_id AND qc.qna_id = q.qna_id AND qc.concept_id = :conceptId
                  ))
                ORDER BY q.qna_id
                LIMIT %d
                """.formatted(BROWSE_LIMIT), params, this::rawMatchRow);
        List<BirbalDtos.Match> qna = rawQna.stream().map(this::toMatch).toList();

        audit(userId, resourceId, scope.chapterId(), "[browse]", null, null, "BROWSE");
        return new BirbalDtos.BrowseResponse(scope.chapterId(), scope.chapterName(), concepts, qna);
    }

    private MapSqlParameterSource parameters(Scope scope, String query) {
        return new MapSqlParameterSource("chapterId", scope.chapterId())
                .addValue("query", query, Types.VARCHAR);
    }

    private Scope scope(int resourceId) {
        try {
            Scope scope = jdbc.queryForObject("""
                    SELECT c.chapter_id, c.chapter_name
                    FROM resource r JOIN chapter c ON c.chapter_id = r.chapter_id
                    WHERE r.resource_id = :resourceId
                    """, Map.of("resourceId", resourceId),
                    (rs, rowNum) -> new Scope(rs.getInt("chapter_id"), rs.getString("chapter_name")));
            if (scope == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");

            Boolean imported = jdbc.queryForObject("""
                    SELECT EXISTS (SELECT 1 FROM corpus_chapter WHERE chapter_id = :chapterId)
                    """, Map.of("chapterId", scope.chapterId()), Boolean.class);
            if (!Boolean.TRUE.equals(imported)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "BirBal content is not available for " + scope.chapterName() + " yet");
            }
            return scope;
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
    }

    private void consumeQuota(long userId) {
        try {
            String key = "birbal:query:" + userId;
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) redisTemplate.expire(key, QUERY_WINDOW);
            if (count == null || count > QUERY_LIMIT) {
                Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                throw new BirbalRateLimitException(ttl != null && ttl > 0 ? ttl : QUERY_WINDOW.toSeconds());
            }
        } catch (BirbalRateLimitException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "BirBal rate limiter is unavailable", ex);
        }
    }

    private RawMatch rawMatchRow(ResultSet rs, int ignored) throws SQLException {
        return new RawMatch(rs.getInt("chapter_id"), rs.getString("qna_id"), rs.getString("question"),
                rs.getString("answer"), rs.getString("type"), rs.getString("difficulty"),
                integers(rs.getArray("source_pages")), rs.getDouble("confidence"));
    }

    private BirbalDtos.Match toMatch(RawMatch raw) {
        return new BirbalDtos.Match(raw.id(), raw.question(), raw.answer(), raw.type(), raw.difficulty(), raw.sourcePages(),
                conceptsFor(raw.chapterId(), raw.id()), raw.confidence());
    }

    private BirbalDtos.Concept conceptRow(ResultSet rs, int ignored) throws SQLException {
        return new BirbalDtos.Concept(rs.getString("concept_id"), rs.getString("concept_name"),
                rs.getString("importance"), integers(rs.getArray("source_pages")), rs.getString("one_line_summary"));
    }

    private List<BirbalDtos.Concept> conceptsFor(int chapterId, String qnaId) {
        return jdbc.query("""
                SELECT c.concept_id, c.concept_name, c.importance, c.source_pages, c.one_line_summary
                FROM corpus_qna_concept qc
                JOIN corpus_concept c ON c.chapter_id = qc.chapter_id AND c.concept_id = qc.concept_id
                WHERE qc.chapter_id = :chapterId AND qc.qna_id = :qnaId ORDER BY c.concept_name
                """, Map.of("chapterId", chapterId, "qnaId", qnaId), this::conceptRow);
    }

    private void audit(long userId, int resourceId, int chapterId, String query, String matchedId,
                       Double score, String outcome) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("resourceId", resourceId)
                .addValue("chapterId", chapterId)
                .addValue("query", query)
                .addValue("matchedId", matchedId)
                .addValue("score", score)
                .addValue("outcome", outcome);
        jdbc.update("""
                INSERT INTO birbal_query_audit (user_id, resource_id, chapter_id, query_text, matched_qna_id, score, outcome)
                VALUES (:userId, :resourceId, :chapterId, :query, :matchedId, :score, :outcome)
                """, params);
    }

    private String requireQuery(String query) {
        String clean = blankToNull(query);
        if (clean == null || clean.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter at least two characters to ask BirBal");
        }
        if (clean.length() > 1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question is too long");
        return clean;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String clean = value.trim();
        return clean.isEmpty() ? null : clean;
    }

    private static List<Integer> integers(Array array) throws SQLException {
        if (array == null) return List.of();
        Object raw = array.getArray();
        if (!(raw instanceof Object[] values)) return List.of();
        List<Integer> result = new ArrayList<>();
        for (Object value : values) if (value instanceof Number number) result.add(number.intValue());
        return result;
    }

    private record Scope(int chapterId, String chapterName) { }
    private record RawMatch(int chapterId, String id, String question, String answer, String type, String difficulty,
                            List<Integer> sourcePages, double confidence) { }
}
