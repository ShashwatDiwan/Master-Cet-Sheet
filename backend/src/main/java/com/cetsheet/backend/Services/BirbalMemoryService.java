package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.BirbalMemoryDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Builds private, bounded study memory from facts already owned by the authenticated student. */
@Service
@RequiredArgsConstructor
public class BirbalMemoryService {
    private static final List<String> SUBJECTS = List.of("Physics", "Chemistry", "Mathematics");
    private static final int GLOBAL_LIMIT = 900;
    private static final int SUBJECT_LIMIT = 1200;
    private static final int WEAK_CHAPTER_LIMIT = 5;
    private static final int WEAK_CONCEPT_LIMIT = 8;
    private static final int RECENT_TEST_LIMIT = 10;

    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public BirbalMemoryDtos.MemoryResponse memory(long userId) {
        BirbalMemoryDtos.Profile profile = profile(userId);
        List<BirbalMemoryDtos.SubjectSnapshot> subjects = snapshots(userId);
        List<BirbalMemoryDtos.RecentTest> recentTests = recentTests(userId);
        return new BirbalMemoryDtos.MemoryResponse(profile, subjects, recentTests,
                externalPrompt(profile, subjects, recentTests), subjectContexts(profile, subjects));
    }

    @Transactional
    public BirbalMemoryDtos.MemoryResponse updateProfile(long userId, BirbalMemoryDtos.ProfileUpdateRequest request) {
        if (request == null) throw badRequest("A BirBal profile is required.");
        String global = cleaned(request.globalSummary(), GLOBAL_LIMIT, "Global summary");
        String physics = cleaned(request.physicsSummary(), SUBJECT_LIMIT, "Physics summary");
        String chemistry = cleaned(request.chemistrySummary(), SUBJECT_LIMIT, "Chemistry summary");
        String mathematics = cleaned(request.mathematicsSummary(), SUBJECT_LIMIT, "Mathematics summary");
        if (global == null && physics == null && chemistry == null && mathematics == null) {
            jdbc.update("DELETE FROM student_birbal_profile WHERE user_id = :userId", Map.of("userId", userId));
            return memory(userId);
        }
        jdbc.update("""
                INSERT INTO student_birbal_profile (user_id, global_summary, physics_summary, chemistry_summary, mathematics_summary)
                VALUES (:userId, :global, :physics, :chemistry, :mathematics)
                ON CONFLICT (user_id) DO UPDATE SET
                    global_summary = EXCLUDED.global_summary,
                    physics_summary = EXCLUDED.physics_summary,
                    chemistry_summary = EXCLUDED.chemistry_summary,
                    mathematics_summary = EXCLUDED.mathematics_summary,
                    updated_at = CURRENT_TIMESTAMP
                """, new MapSqlParameterSource("userId", userId)
                .addValue("global", global).addValue("physics", physics).addValue("chemistry", chemistry)
                .addValue("mathematics", mathematics));
        return memory(userId);
    }

    /** Future LLM routing can call this with the active resource's canonical subject. */
    @Transactional(readOnly = true)
    public String subjectContext(long userId, String subject) {
        String canonical = canonicalSubject(subject);
        BirbalMemoryDtos.Profile profile = profile(userId);
        BirbalMemoryDtos.SubjectSnapshot snapshot = snapshots(userId).stream()
                .filter(item -> item.subject().equals(canonical)).findFirst()
                .orElseThrow(() -> badRequest("BirBal memory is available for Physics, Chemistry, or Mathematics."));
        return subjectContext(profile, snapshot);
    }

    private BirbalMemoryDtos.Profile profile(long userId) {
        List<BirbalMemoryDtos.Profile> profiles = jdbc.query("""
                SELECT global_summary, physics_summary, chemistry_summary, mathematics_summary, updated_at
                FROM student_birbal_profile WHERE user_id = :userId
                """, Map.of("userId", userId), (rs, ignored) -> new BirbalMemoryDtos.Profile(
                rs.getString("global_summary"), rs.getString("physics_summary"), rs.getString("chemistry_summary"),
                rs.getString("mathematics_summary"), instant(rs, "updated_at")));
        return profiles.isEmpty() ? new BirbalMemoryDtos.Profile(null, null, null, null, null) : profiles.get(0);
    }

    private List<BirbalMemoryDtos.SubjectSnapshot> snapshots(long userId) {
        Map<String, SubjectBuilder> builders = new LinkedHashMap<>();
        SUBJECTS.forEach(subject -> builders.put(subject, new SubjectBuilder(subject)));
        progress(userId, builders);
        weakChapters(userId, builders);
        weakConcepts(userId, builders);
        reasons(userId, builders);
        return builders.values().stream().map(SubjectBuilder::build).toList();
    }

    private void progress(long userId, Map<String, SubjectBuilder> builders) {
        jdbc.query("""
                SELECT sh.subject, count(c.chapter_id) AS total,
                       COALESCE(sum(CASE WHEN cp.completed THEN 1 ELSE 0 END), 0) AS completed,
                       COALESCE(sum(CASE WHEN cp.revised THEN 1 ELSE 0 END), 0) AS revised
                FROM sheet sh JOIN chapter c ON c.sheet_id = sh.sheet_id
                LEFT JOIN chapter_progress cp ON cp.chapter_id = c.chapter_id AND cp.user_id = :userId
                GROUP BY sh.subject
                """, Map.of("userId", userId), (rs, ignored) -> {
            SubjectBuilder builder = builders.get(canonicalSubject(rs.getString("subject")));
            if (builder != null) {
                builder.totalChapters = rs.getLong("total");
                builder.completedChapters = rs.getLong("completed");
                builder.revisedChapters = rs.getLong("revised");
            }
            return null;
        });
    }

    private void weakChapters(long userId, Map<String, SubjectBuilder> builders) {
        jdbc.query("""
                SELECT cc.subject, cc.chapter_name, count(*) AS total
                FROM student_mistakes m JOIN corpus_chapter cc ON cc.chapter_id = m.chapter_id
                WHERE m.user_id = :userId
                GROUP BY cc.subject, cc.chapter_name ORDER BY total DESC, cc.chapter_name ASC
                """, Map.of("userId", userId), (rs, ignored) -> {
            SubjectBuilder builder = builders.get(canonicalSubject(rs.getString("subject")));
            if (builder != null && builder.weakChapters.size() < WEAK_CHAPTER_LIMIT) {
                builder.weakChapters.add(new BirbalMemoryDtos.WeakChapter(rs.getString("chapter_name"), rs.getLong("total")));
            }
            return null;
        });
    }

    private void weakConcepts(long userId, Map<String, SubjectBuilder> builders) {
        jdbc.query("""
                SELECT cc.subject, cc.chapter_name, c.concept_name, s.mistake_count, s.top_reason,
                       s.weakness_score, s.last_mistake_on
                FROM concept_state s
                JOIN corpus_chapter cc ON cc.chapter_id = s.chapter_id
                JOIN corpus_concept c ON c.chapter_id = s.chapter_id AND c.concept_id = s.concept_id
                WHERE s.user_id = :userId
                ORDER BY s.weakness_score DESC, s.mistake_count DESC, s.last_mistake_on DESC, c.concept_name ASC
                """, Map.of("userId", userId), (rs, ignored) -> {
            SubjectBuilder builder = builders.get(canonicalSubject(rs.getString("subject")));
            if (builder != null && builder.weakConcepts.size() < WEAK_CONCEPT_LIMIT) {
                builder.weakConcepts.add(new BirbalMemoryDtos.WeakConcept(rs.getString("chapter_name"),
                        rs.getString("concept_name"), rs.getInt("mistake_count"), rs.getString("top_reason"),
                        rs.getBigDecimal("weakness_score"), rs.getObject("last_mistake_on", LocalDate.class)));
            }
            return null;
        });
    }

    private void reasons(long userId, Map<String, SubjectBuilder> builders) {
        jdbc.query("""
                SELECT sh.subject, m.reason, count(*) AS total
                FROM student_mistakes m
                JOIN chapter c ON c.chapter_id = m.chapter_id
                JOIN sheet sh ON sh.sheet_id = c.sheet_id
                WHERE m.user_id = :userId
                GROUP BY sh.subject, m.reason
                ORDER BY sh.subject, total DESC, m.reason ASC
                """, Map.of("userId", userId), (rs, ignored) -> {
            SubjectBuilder builder = builders.get(canonicalSubject(rs.getString("subject")));
            if (builder != null) builder.reasonPatterns.add(new BirbalMemoryDtos.ReasonPattern(
                    friendlyReason(rs.getString("reason")), rs.getLong("total")));
            return null;
        });
    }

    private List<BirbalMemoryDtos.RecentTest> recentTests(long userId) {
        return jdbc.query("""
                SELECT name, test_date, score, max_score, round((score * 100.0 / max_score), 1) AS percentage
                FROM student_tests WHERE user_id = :userId
                ORDER BY test_date DESC, created_at DESC LIMIT %d
                """.formatted(RECENT_TEST_LIMIT), Map.of("userId", userId), (rs, ignored) ->
                new BirbalMemoryDtos.RecentTest(rs.getString("name"), rs.getObject("test_date", LocalDate.class),
                        rs.getBigDecimal("score"), rs.getBigDecimal("max_score"), rs.getBigDecimal("percentage")));
    }

    private List<BirbalMemoryDtos.SubjectContext> subjectContexts(BirbalMemoryDtos.Profile profile,
                                                                    List<BirbalMemoryDtos.SubjectSnapshot> subjects) {
        return subjects.stream().map(subject -> new BirbalMemoryDtos.SubjectContext(subject.subject(),
                subjectContext(profile, subject))).toList();
    }

    private String subjectContext(BirbalMemoryDtos.Profile profile, BirbalMemoryDtos.SubjectSnapshot subject) {
        StringBuilder prompt = new StringBuilder("PREPPILOT STUDENT MEMORY — ").append(subject.subject()).append("\n")
                .append("Use this only to tailor explanations, examples, pacing, and revision suggestions for this ")
                .append(subject.subject()).append(" question. Do not mention unrelated subjects.\n\n")
                .append("Global learning preferences:\n").append(orNone(profile.globalSummary())).append("\n\n")
                .append(subject.subject()).append(" profile:\n").append(orNone(summaryFor(profile, subject.subject()))).append("\n\n")
                .append("Trusted PrepPilot signals:\n")
                .append("- Progress: ").append(subject.completedChapters()).append('/').append(subject.totalChapters())
                .append(" chapters completed; ").append(subject.revisedChapters()).append(" revised.\n");
        appendWeakChapters(prompt, subject.weakChapters());
        appendWeakConcepts(prompt, subject.weakConcepts());
        appendReasons(prompt, subject.reasonPatterns());
        return truncate(prompt.toString(), 4000);
    }

    private String externalPrompt(BirbalMemoryDtos.Profile profile, List<BirbalMemoryDtos.SubjectSnapshot> subjects,
                                  List<BirbalMemoryDtos.RecentTest> tests) {
        StringBuilder prompt = new StringBuilder("""
                You are a study-profile analyst helping an MHT-CET student. Use only the trusted PrepPilot facts below and relevant study context already present in this conversation. Do not invent scores, habits, diagnoses, or weaknesses. Create concise, practical memory for another tutor AI.

                Return exactly these four headings, in this order, with no preface:
                [GLOBAL]
                [PHYSICS]
                [CHEMISTRY]
                [MATHEMATICS]

                Rules:
                - GLOBAL: learning preferences and cross-subject study strategy only; maximum 900 characters.
                - Each subject section: subject-specific strengths, weaknesses, typical mistake patterns, and coaching approach; maximum 1,200 characters.
                - Keep subjects isolated. If evidence is missing, say that no PrepPilot evidence exists yet.

                TRUSTED PREPPILOT FACTS
                """);
        if (!tests.isEmpty()) {
            prompt.append("Recent whole-test scores (a test may cover multiple subjects):\n");
            tests.forEach(test -> prompt.append("- ").append(test.name()).append(": ")
                    .append(test.score().stripTrailingZeros().toPlainString()).append('/').append(test.maxScore().stripTrailingZeros().toPlainString())
                    .append(" (").append(test.percentage().stripTrailingZeros().toPlainString()).append("%), ")
                    .append(test.testDate()).append('\n'));
        }
        for (BirbalMemoryDtos.SubjectSnapshot subject : subjects) {
            prompt.append('\n').append(subject.subject().toUpperCase(Locale.ROOT)).append(" FACTS\n")
                    .append("Progress: ").append(subject.completedChapters()).append('/').append(subject.totalChapters())
                    .append(" completed; ").append(subject.revisedChapters()).append(" revised.\n");
            appendWeakChapters(prompt, subject.weakChapters());
            appendWeakConcepts(prompt, subject.weakConcepts());
            appendReasons(prompt, subject.reasonPatterns());
        }
        if (profile.updatedAt() != null) prompt.append("\nPreviously saved PrepPilot profile exists; refine it rather than contradicting it.\n");
        return prompt.toString().trim();
    }

    private void appendWeakChapters(StringBuilder target, List<BirbalMemoryDtos.WeakChapter> chapters) {
        if (chapters.isEmpty()) return;
        target.append("- Weak chapters: ");
        target.append(String.join("; ", chapters.stream().map(item -> truncate(item.name(), 80) + " (" + item.mistakeCount() + ")").toList()));
        target.append(".\n");
    }

    private void appendWeakConcepts(StringBuilder target, List<BirbalMemoryDtos.WeakConcept> concepts) {
        if (concepts.isEmpty()) return;
        target.append("- Weak concepts: ");
        target.append(String.join("; ", concepts.stream().map(item -> truncate(item.conceptName(), 80) + " in "
                + truncate(item.chapterName(), 60) + " (" + item.mistakeCount() + ", " + friendlyReason(item.topReason())
                + ", last " + item.lastMistakeOn() + ")").toList()));
        target.append(".\n");
    }

    private void appendReasons(StringBuilder target, List<BirbalMemoryDtos.ReasonPattern> reasons) {
        if (reasons.isEmpty()) return;
        target.append("- Mistake patterns: ");
        target.append(String.join("; ", reasons.stream().map(item -> item.reason() + " (" + item.mistakeCount() + ")").toList()));
        target.append(".\n");
    }

    private String summaryFor(BirbalMemoryDtos.Profile profile, String subject) {
        return switch (subject) {
            case "Physics" -> profile.physicsSummary();
            case "Chemistry" -> profile.chemistrySummary();
            case "Mathematics" -> profile.mathematicsSummary();
            default -> null;
        };
    }

    private static String canonicalSubject(String value) {
        if (value == null) return "";
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("phys")) return "Physics";
        if (normalized.startsWith("chem")) return "Chemistry";
        if (normalized.startsWith("math")) return "Mathematics";
        return value.trim();
    }

    private static String friendlyReason(String value) {
        if (value == null) return "Unknown";
        return switch (value) {
            case "CONCEPT_GAP" -> "Concept gap";
            case "FORGOT_FORMULA" -> "Forgot formula";
            case "CALCULATION_SLIP" -> "Calculation slip";
            case "MISREAD_QUESTION" -> "Misread question";
            case "RAN_OUT_OF_TIME" -> "Ran out of time";
            default -> value;
        };
    }

    private static String cleaned(String value, int maximum, String label) {
        if (value == null || value.trim().isEmpty()) return null;
        String result = value.trim();
        if (result.length() > maximum) throw badRequest(label + " must be at most " + maximum + " characters.");
        return result;
    }

    private static String truncate(String value, int maximum) {
        if (value == null || value.length() <= maximum) return value == null ? "" : value;
        return value.substring(0, Math.max(0, maximum - 1)) + "…";
    }

    private static String orNone(String value) { return value == null || value.isBlank() ? "No saved summary yet." : value; }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static final class SubjectBuilder {
        private final String subject;
        private long totalChapters;
        private long completedChapters;
        private long revisedChapters;
        private final List<BirbalMemoryDtos.WeakChapter> weakChapters = new ArrayList<>();
        private final List<BirbalMemoryDtos.WeakConcept> weakConcepts = new ArrayList<>();
        private final List<BirbalMemoryDtos.ReasonPattern> reasonPatterns = new ArrayList<>();

        private SubjectBuilder(String subject) { this.subject = subject; }

        private BirbalMemoryDtos.SubjectSnapshot build() {
            weakChapters.sort(Comparator.comparingLong(BirbalMemoryDtos.WeakChapter::mistakeCount).reversed()
                    .thenComparing(BirbalMemoryDtos.WeakChapter::name));
            return new BirbalMemoryDtos.SubjectSnapshot(subject, totalChapters, completedChapters, revisedChapters,
                    List.copyOf(weakChapters), List.copyOf(weakConcepts), List.copyOf(reasonPatterns));
        }
    }
}
