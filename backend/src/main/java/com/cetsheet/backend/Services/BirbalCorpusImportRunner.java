package com.cetsheet.backend.Services;

import com.cetsheet.backend.config.BirbalCorpusProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Types;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/** Explicit, local-only importer for externally generated corpus JSON files. */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.birbal", name = "import-enabled", havingValue = "true")
public class BirbalCorpusImportRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(BirbalCorpusImportRunner.class);
    private final BirbalCorpusProperties properties;
    private final ObjectMapper objectMapper;
    private final NamedParameterJdbcTemplate jdbc;
    private final TransactionTemplate transactionTemplate;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (properties.getImportDirectory() == null || properties.getImportDirectory().isBlank()) {
            throw new IllegalStateException("BIRBAL_IMPORT_DIRECTORY is required when BIRBAL_IMPORT_ENABLED=true");
        }
        Path directory = Path.of(properties.getImportDirectory());
        if (!Files.isDirectory(directory)) throw new IllegalArgumentException("BirBal import directory does not exist: " + directory);

        List<Path> files;
        try (Stream<Path> paths = Files.walk(directory)) {
            files = paths.filter(path -> Files.isRegularFile(path) && path.getFileName().toString().endsWith(".json"))
                    .sorted(Comparator.comparing(Path::toString)).toList();
        }
        if (files.isEmpty()) throw new IllegalArgumentException("No JSON corpus files found in " + directory);

        List<String> report = new ArrayList<>();
        for (Path file : files) {
            try {
                ImportResult result = transactionTemplate.execute(status -> {
                    try {
                        return importFile(file);
                    } catch (IOException ex) {
                        throw new java.io.UncheckedIOException(ex);
                    }
                });
                report.add("IMPORTED " + file.getFileName() + " -> chapter " + result.chapterId + " (" + result.questionCount + " Q&A)");
            } catch (Exception ex) {
                report.add("REJECTED " + file.getFileName() + " -> " + ex.getMessage());
                log.warn("BirBal corpus file rejected: {}", file, ex);
            }
        }
        Path reportPath = directory.resolve("birbal-import-report-" + Instant.now().toEpochMilli() + ".txt");
        Files.write(reportPath, report);
        long failures = report.stream().filter(line -> line.startsWith("REJECTED")).count();
        log.info("BirBal import finished: {} files, {} rejected. Review {}", files.size(), failures, reportPath);
        if (failures > 0) {
            // Mixed third-party JSON is expected. A bad chapter must not take the live
            // reader down; its exact reason is preserved in the review report instead.
            log.warn("BirBal import left {} file(s) for review. The reader remains available.", failures);
        }
    }

    protected ImportResult importFile(Path file) throws IOException {
        JsonNode root = objectMapper.readTree(file.toFile());
        if (root == null || !root.isObject()) throw new IllegalArgumentException("root must be a JSON object");

        String inputName = text(root, "chapterName", "chapter_name", "name", "title");
        String inputSubject = text(root, "subject", "sheet", "subjectName");
        Integer inputId = integer(root, "chapterId", "chapter_id", "id");
        Chapter chapter = resolveChapter(inputId, inputName, inputSubject);
        List<Concept> concepts = concepts(root.path("concepts"), chapter.id());
        List<Qna> qna = qna(firstArray(root, "qna", "questions", "questionsAndAnswers", "questionAnswers"), chapter.id(), concepts);
        if (qna.isEmpty()) throw new IllegalArgumentException("no valid question/answer pairs found");

        jdbc.update("DELETE FROM corpus_qna_concept WHERE chapter_id = :chapterId", Map.of("chapterId", chapter.id()));
        jdbc.update("DELETE FROM corpus_qna WHERE chapter_id = :chapterId", Map.of("chapterId", chapter.id()));
        jdbc.update("DELETE FROM corpus_concept WHERE chapter_id = :chapterId", Map.of("chapterId", chapter.id()));
        jdbc.update("DELETE FROM corpus_chapter WHERE chapter_id = :chapterId", Map.of("chapterId", chapter.id()));

        Integer preferredResourceId = preferredResourceId(chapter.id());
        if (preferredResourceId == null) {
            // Do not make a corpus reachable through a PYQ-only resource. The same
            // rule also holds corpus content until a NOTES/SHORT_NOTES resource is attached.
            throw new IllegalArgumentException("no NOTES or SHORT_NOTES resource is attached to this chapter");
        }
        MapSqlParameterSource chapterParams = new MapSqlParameterSource()
                .addValue("chapterId", chapter.id()).addValue("resourceId", preferredResourceId, Types.INTEGER)
                .addValue("subject", chapter.subject()).addValue("chapterName", chapter.name());
        jdbc.update("""
                INSERT INTO corpus_chapter (chapter_id, source_resource_id, subject, chapter_name)
                VALUES (:chapterId, :resourceId, :subject, :chapterName)
                """, chapterParams);

        for (Concept concept : concepts) {
            jdbc.update("""
                    INSERT INTO corpus_concept (chapter_id, concept_id, concept_name, importance, source_pages, one_line_summary)
                    VALUES (:chapterId, :id, :name, :importance, :pages, :summary)
                    """, params(chapter.id(), concept));
        }
        for (Qna item : qna) {
            jdbc.update("""
                    INSERT INTO corpus_qna (chapter_id, qna_id, question, answer, type, difficulty, source_pages, search_text)
                    VALUES (:chapterId, :id, :question, :answer, :type, :difficulty, :pages, :searchText)
                    """, params(chapter.id(), item));
            for (String conceptId : item.conceptIds()) {
                if (concepts.stream().anyMatch(concept -> concept.id().equals(conceptId))) {
                    jdbc.update("""
                            INSERT INTO corpus_qna_concept (chapter_id, qna_id, concept_id)
                            VALUES (:chapterId, :qnaId, :conceptId)
                            """, Map.of("chapterId", chapter.id(), "qnaId", item.id(), "conceptId", conceptId));
                }
            }
        }
        return new ImportResult(chapter.id(), qna.size());
    }

    private Chapter resolveChapter(Integer id, String name, String subject) {
        List<Chapter> chapters;
        if (id != null) {
            chapters = jdbc.query("""
                    SELECT c.chapter_id, c.chapter_name, s.subject
                    FROM chapter c JOIN sheet s ON s.sheet_id = c.sheet_id WHERE c.chapter_id = :id
                    """, Map.of("id", id), this::chapterRow);
        } else if (name != null && subject != null) {
            chapters = jdbc.query("""
                    SELECT c.chapter_id, c.chapter_name, s.subject
                    FROM chapter c JOIN sheet s ON s.sheet_id = c.sheet_id
                    WHERE lower(c.chapter_name) = lower(:name) AND lower(s.subject) = lower(:subject)
                    """, Map.of("name", name.trim(), "subject", subject.trim()), this::chapterRow);
        } else {
            throw new IllegalArgumentException("chapterId is absent; chapterName and subject are required for lookup");
        }
        if (chapters.size() != 1) throw new IllegalArgumentException("chapter could not be resolved uniquely");
        return chapters.get(0);
    }

    private Integer preferredResourceId(int chapterId) {
        List<Integer> ids = jdbc.query("""
                SELECT resource_id FROM resource
                WHERE chapter_id = :chapterId AND type IN ('NOTES', 'SHORT_NOTES')
                ORDER BY CASE type WHEN 'NOTES' THEN 0 ELSE 1 END, resource_id
                LIMIT 1
                """, Map.of("chapterId", chapterId), (rs, ignored) -> rs.getInt(1));
        return ids.isEmpty() ? null : ids.get(0);
    }

    private List<Concept> concepts(JsonNode node, int chapterId) {
        if (!node.isArray()) return List.of();
        List<Concept> result = new ArrayList<>();
        int sequence = 1;
        for (JsonNode entry : node) {
            String name = text(entry, "name", "title", "concept", "label");
            if (name == null) continue;
            String id = text(entry, "id", "conceptId", "concept_id");
            result.add(new Concept(id == null ? "C" + String.format("%03d", sequence) : id.trim(), name.trim(),
                    text(entry, "importance", "priority"), pages(entry), text(entry, "oneLineSummary", "one_line_summary", "summary", "description")));
            sequence++;
        }
        return result;
    }

    private List<Qna> qna(JsonNode node, int chapterId, List<Concept> concepts) {
        if (!node.isArray()) return List.of();
        Map<String, Concept> conceptsById = new LinkedHashMap<>();
        concepts.forEach(concept -> conceptsById.put(concept.id(), concept));
        List<Qna> result = new ArrayList<>();
        int sequence = 1;
        for (JsonNode entry : node) {
            String question = text(entry, "question", "prompt", "q");
            String answer = text(entry, "answer", "response", "a", "explanation");
            if (question == null || answer == null) continue;
            String id = text(entry, "id", "qnaId", "qna_id");
            List<String> conceptIds = strings(entry, "conceptIds", "concept_ids", "concepts");
            String conceptText = conceptIds.stream().map(conceptsById::get).filter(java.util.Objects::nonNull)
                    .map(concept -> concept.name() + " " + nullToEmpty(concept.summary())).reduce("", (a, b) -> a + " " + b);
            result.add(new Qna(id == null ? "Q" + String.format("%03d", sequence) : id.trim(), question.trim(), answer.trim(),
                    text(entry, "type", "questionType", "question_type"), text(entry, "difficulty", "level"), pages(entry), conceptIds,
                    (question + " " + answer + " " + conceptText).toLowerCase(Locale.ROOT)));
            sequence++;
        }
        return result;
    }

    private MapSqlParameterSource params(int chapterId, Concept concept) {
        return new MapSqlParameterSource().addValue("chapterId", chapterId)
                .addValue("id", concept.id()).addValue("name", concept.name()).addValue("importance", concept.importance())
                .addValue("pages", concept.pages().toArray(Integer[]::new)).addValue("summary", concept.summary());
    }

    private MapSqlParameterSource params(int chapterId, Qna qna) {
        return new MapSqlParameterSource().addValue("chapterId", chapterId)
                .addValue("id", qna.id()).addValue("question", qna.question()).addValue("answer", qna.answer())
                .addValue("type", qna.type()).addValue("difficulty", qna.difficulty())
                .addValue("pages", qna.pages().toArray(Integer[]::new)).addValue("searchText", qna.searchText());
    }

    private Chapter chapterRow(java.sql.ResultSet rs, int ignored) throws java.sql.SQLException {
        return new Chapter(rs.getInt("chapter_id"), rs.getString("chapter_name"), rs.getString("subject"));
    }

    private static JsonNode firstArray(JsonNode node, String... names) {
        for (String name : names) if (node.path(name).isArray()) return node.path(name);
        return MissingNode.getInstance();
    }

    private static String text(JsonNode node, String... names) {
        for (String name : names) if (node.hasNonNull(name) && !node.path(name).asText().isBlank()) return node.path(name).asText();
        return null;
    }

    private static Integer integer(JsonNode node, String... names) {
        for (String name : names) if (node.hasNonNull(name) && node.path(name).canConvertToInt()) return node.path(name).asInt();
        return null;
    }

    private static List<String> strings(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode candidate = node.path(name);
            if (!candidate.isArray()) continue;
            List<String> values = new ArrayList<>();
            for (JsonNode value : candidate) {
                if (value.isTextual()) values.add(value.asText());
                else if (value.isObject()) {
                    String id = text(value, "id", "conceptId", "concept_id");
                    if (id != null) values.add(id);
                }
            }
            return values;
        }
        return List.of();
    }

    private static List<Integer> pages(JsonNode node) {
        JsonNode source = node.path("sourcePages");
        if (source.isMissingNode()) source = node.path("source_pages");
        if (source.isMissingNode()) source = node.path("pages");
        List<Integer> result = new ArrayList<>();
        if (source.isArray()) for (JsonNode page : source) addPage(result, page.asText());
        else if (!source.isMissingNode() && !source.isNull()) addPage(result, source.asText());
        return result.stream().filter(page -> page > 0).distinct().sorted().toList();
    }

    private static void addPage(List<Integer> pages, String value) {
        for (String part : value.split("[^0-9]+")) if (!part.isBlank()) pages.add(Integer.parseInt(part));
    }

    private static String nullToEmpty(String value) { return value == null ? "" : value; }

    private record Chapter(int id, String name, String subject) { }
    private record Concept(String id, String name, String importance, List<Integer> pages, String summary) { }
    private record Qna(String id, String question, String answer, String type, String difficulty, List<Integer> pages,
                       List<String> conceptIds, String searchText) { }
    private record ImportResult(int chapterId, int questionCount) { }
}
