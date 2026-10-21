package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.ChapterDTO;
import com.cetsheet.backend.dto.CustomizedPlanRequestDTO;
import com.cetsheet.backend.dto.InstantPlanRequestDTO;
import com.cetsheet.backend.dto.PlanDayType;
import com.cetsheet.backend.dto.PlanMyDayRequestDTO;
import com.cetsheet.backend.dto.PlanMyDayResponseDTO;
import com.cetsheet.backend.dto.SheetDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanMyDayService {

    private static final int DEFAULT_AVAILABLE_MINUTES = 180;
    private static final int DEFAULT_MAX_SESSION_MINUTES = 45;
    private static final int DEFAULT_BREAK_MINUTES = 10;
    private static final int MIN_BLOCK_MINUTES = 15;
    private static final int MAX_CHAPTERS_IN_PROMPT = 10;
    private static final String DEFAULT_START_TIME = "06:30";
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private static final String SYSTEM_PROMPT = """
        You are a practical CET study planner.
        Create realistic, time-blocked day plans.
        Prioritize using weightage, completion, and revision status.
        Return only valid JSON.
            """;

    private final SheetService sheetService;
    private final ChapterPriorityService chapterPriorityService;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public PlanMyDayResponseDTO createInstantPlan(Long userId, InstantPlanRequestDTO request) {
        NormalizedRequest normalized = normalizeInstantRequest(request == null ? new InstantPlanRequestDTO() : request);
        return createPlanFromNormalized(userId, normalized);
    }

    public PlanMyDayResponseDTO createCustomizedPlan(Long userId, CustomizedPlanRequestDTO request) {
        NormalizedRequest normalized = normalizeCustomizedRequest(request);
        return createPlanFromNormalized(userId, normalized);
    }

    @Deprecated
    public PlanMyDayResponseDTO createPlan(Long userId, PlanMyDayRequestDTO request) {
        CustomizedPlanRequestDTO mapped = new CustomizedPlanRequestDTO();
        mapped.setSheetId(request.getSheetId());
        mapped.setAvailableMinutes(request.getAvailableMinutes());
        mapped.setMaxSessionMinutes(request.getMaxSessionMinutes());
        mapped.setBreakMinutes(request.getBreakMinutes());
        mapped.setPreferredStartTime(request.getPreferredStartTime());
        mapped.setIncludeRevision(request.getIncludeRevision());
        mapped.setCustomMessage(request.getAdditionalInstructions());
        mapped.setDayType(PlanDayType.WORKDAY);
        return createCustomizedPlan(userId, mapped);
    }

    private PlanMyDayResponseDTO createPlanFromNormalized(Long userId, NormalizedRequest normalized) {
        List<ChapterCandidate> candidates = loadChapterCandidates(
                userId,
                normalized.sheetId(),
                normalized.includeRevision(),
                normalized.dayType()
        );

        if (candidates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No eligible chapters found to build a plan");
        }

        List<ChapterCandidate> promptCandidates = candidates.stream()
                .limit(MAX_CHAPTERS_IN_PROMPT)
                .toList();

        String planDate = LocalDate.now(ZoneId.of(normalized.timezone())).toString();

        String promptCatalogJson = toJsonSilently(promptCandidates.stream()
                .map(this::toPromptChapter)
                .toList());

        String userPrompt = buildUserPrompt(normalized, planDate, promptCatalogJson);

        AiPlanOutput aiOutput = null;
        boolean fallbackUsed = false;

        try {
            aiOutput = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .entity(AiPlanOutput.class);
        } catch (Exception ex) {
            fallbackUsed = true;
            log.warn("Plan generation fell back to deterministic scheduler for userId={}: {}", userId, ex.getMessage());
        }

        List<PlannedTask> plannedTasks = validateAndTransformAiTasks(aiOutput, promptCandidates, normalized);
        if (plannedTasks.isEmpty()) {
            fallbackUsed = true;
            plannedTasks = buildFallbackPlan(promptCandidates, normalized);
        }

        return buildResponse(planDate, normalized, plannedTasks, promptCandidates, aiOutput, fallbackUsed, userPrompt);
    }

    private String buildUserPrompt(NormalizedRequest normalized, String planDate, String chapterCatalogJson) {
        return """
        Create a one-day study plan in JSON.

        Rules:
        - Total minutes <= %d
        - Each task duration must be between %d and %d
        - Use only chapterId from the list
        - Prefer incomplete + high weightage chapters first
        - Respect the day type preference while selecting tasks
        - Keep reasons short

        Student preferences:
        - Date: %s
        - Day type: %s
        - Include revision: %s
        - Extra instruction: %s

        Chapters JSON:
            %s

        Return exactly this schema:
            {
              "summary": "short daily strategy",
              "tasks": [
                {
                  "chapterId": 123,
                  "durationMinutes": 45,
                  "revision": false,
                  "reason": "high weightage and pending completion"
                }
              ]
            }

            Return only valid JSON.
            """.formatted(
                normalized.availableMinutes(),
                MIN_BLOCK_MINUTES,
                normalized.maxSessionMinutes(),
                planDate,
                normalized.dayType().name(),
                normalized.includeRevision(),
                normalized.additionalInstructions(),
                chapterCatalogJson
        );
    }

    private PlanMyDayResponseDTO buildResponse(
            String planDate,
            NormalizedRequest normalized,
            List<PlannedTask> plannedTasks,
            List<ChapterCandidate> promptCandidates,
            AiPlanOutput aiOutput,
            boolean fallbackUsed,
            String userPrompt
    ) {
        LocalTime currentStart = LocalTime.parse(normalized.preferredStartTime(), TIME_FORMAT);

        List<PlanMyDayResponseDTO.StudyBlockDTO> blocks = new ArrayList<>();
        int studyMinutes = 0;
        for (int i = 0; i < plannedTasks.size(); i++) {
            PlannedTask task = plannedTasks.get(i);
            LocalTime end = currentStart.plusMinutes(task.durationMinutes());

            blocks.add(PlanMyDayResponseDTO.StudyBlockDTO.builder()
                    .order(i + 1)
                    .startTime(currentStart.format(TIME_FORMAT))
                    .endTime(end.format(TIME_FORMAT))
                    .durationMinutes(task.durationMinutes())
                    .chapterId(task.chapter().getChapterId())
                    .chapterName(task.chapter().getChapterName())
                    .sheetName(task.chapter().getSheetName())
                    .subject(task.chapter().getSubject())
                    .revision(task.revision())
                    .reason(task.reason())
                    .priorityScore(task.chapter().getPriorityScore())
                    .build());

            studyMinutes += task.durationMinutes();
            currentStart = end;
            if (i < plannedTasks.size() - 1) {
                currentStart = currentStart.plusMinutes(normalized.breakMinutes());
            }
        }

        List<PlanMyDayResponseDTO.FocusChapterDTO> focusChapters = promptCandidates.stream()
                .limit(5)
                .map(chapter -> PlanMyDayResponseDTO.FocusChapterDTO.builder()
                        .chapterId(chapter.getChapterId())
                        .chapterName(chapter.getChapterName())
                        .sheetName(chapter.getSheetName())
                        .subject(chapter.getSubject())
                        .weightage(chapter.getWeightage())
                        .completed(chapter.isCompleted())
                        .revised(chapter.isRevised())
                        .priorityScore(chapter.getPriorityScore())
                        .build())
                .toList();

        String summary = aiOutput != null && aiOutput.getSummary() != null && !aiOutput.getSummary().isBlank()
                ? aiOutput.getSummary().trim()
            : "Focus on high-weightage incomplete chapters first, then revision where needed.";

        int breakMinutes = Math.max(0, (blocks.size() - 1) * normalized.breakMinutes());

        return PlanMyDayResponseDTO.builder()
                .planDate(planDate)
                .timezone(normalized.timezone())
                .totalStudyMinutes(studyMinutes)
                .totalBreakMinutes(breakMinutes)
                .summary(summary)
                .fallbackUsed(fallbackUsed)
                .estimatedPromptTokens(estimateTokens(userPrompt))
                .estimatedCompletionTokens(estimateTokens(toJsonSilently(aiOutput)))
                .blocks(blocks)
                .focusChapters(focusChapters)
                .build();
    }

    private List<PlannedTask> validateAndTransformAiTasks(
            AiPlanOutput aiOutput,
            List<ChapterCandidate> candidates,
            NormalizedRequest normalized
    ) {
        if (aiOutput == null || aiOutput.getTasks() == null || aiOutput.getTasks().isEmpty()) {
            return List.of();
        }

        Map<Integer, ChapterCandidate> chapterById = candidates.stream()
                .collect(Collectors.toMap(ChapterCandidate::getChapterId, c -> c, (left, right) -> left, LinkedHashMap::new));

        int remainingMinutes = normalized.availableMinutes();
        List<PlannedTask> tasks = new ArrayList<>();
        Set<Integer> usedChapterIds = new HashSet<>();

        for (AiTask task : aiOutput.getTasks()) {
            if (task == null) {
                continue;
            }
            ChapterCandidate chapter = chapterById.get(task.getChapterId());
            if (chapter == null) {
                continue;
            }
            if (usedChapterIds.contains(chapter.getChapterId())) {
                continue;
            }

            int duration = sanitizeDuration(task.getDurationMinutes(), normalized.maxSessionMinutes(), remainingMinutes);
            if (duration < MIN_BLOCK_MINUTES) {
                continue;
            }

            boolean revision = normalized.includeRevision() && task.isRevision();
            String reason = (task.getReason() == null || task.getReason().isBlank())
                    ? "Priority selected from weightage and progress status"
                    : task.getReason().trim();

            tasks.add(new PlannedTask(chapter, duration, revision, reason));
            usedChapterIds.add(chapter.getChapterId());
            remainingMinutes -= duration;
            if (remainingMinutes < MIN_BLOCK_MINUTES) {
                break;
            }
        }

        return tasks;
    }

    private List<PlannedTask> buildFallbackPlan(List<ChapterCandidate> candidates, NormalizedRequest normalized) {
        List<PlannedTask> plan = new ArrayList<>();
        int remaining = normalized.availableMinutes();
        int cursor = 0;

        while (remaining >= MIN_BLOCK_MINUTES && !candidates.isEmpty()) {
            ChapterCandidate chapter = candidates.get(cursor % candidates.size());
            int duration = Math.min(normalized.maxSessionMinutes(), remaining);
            if (duration < MIN_BLOCK_MINUTES) {
                break;
            }

            boolean revision = normalized.includeRevision() && chapter.isCompleted() && !chapter.isRevised();
            String reason = chapter.isCompleted()
                    ? "Revision block for a completed chapter"
                    : "High weightage chapter still incomplete";

            plan.add(new PlannedTask(chapter, duration, revision, reason));
            remaining -= duration;
            cursor++;
        }
        return plan;
    }

    private int sanitizeDuration(Integer aiDuration, int maxSessionMinutes, int remainingMinutes) {
        if (remainingMinutes < MIN_BLOCK_MINUTES) {
            return 0;
        }

        int raw = aiDuration == null ? maxSessionMinutes : aiDuration;
        int bounded = Math.max(MIN_BLOCK_MINUTES, Math.min(maxSessionMinutes, raw));
        if (bounded > remainingMinutes) {
            bounded = remainingMinutes;
        }
        if (bounded < MIN_BLOCK_MINUTES) {
            return 0;
        }
        return bounded;
    }

    private List<ChapterCandidate> loadChapterCandidates(
            Long userId,
            Integer sheetId,
            boolean includeRevision,
            PlanDayType dayType
    ) {
        List<SheetDTO> sourceSheets;
        if (sheetId != null) {
            sourceSheets = List.of(sheetService.getSheetById(sheetId, userId));
        } else {
            sourceSheets = sheetService.getAllSheets(userId);
        }

        List<ChapterCandidate> candidates = new ArrayList<>();
        for (SheetDTO sheet : sourceSheets) {
            if (sheet == null || sheet.getChapters() == null || sheet.getChapters().isEmpty()) {
                continue;
            }

            for (ChapterDTO chapter : sheet.getChapters()) {
                if (chapter == null) {
                    continue;
                }
                if (!includeRevision && chapter.isCompleted()) {
                    continue;
                }

                ChapterCandidate candidate = ChapterCandidate.builder()
                        .chapterId(chapter.getChapterId())
                        .chapterName(defaultIfBlank(chapter.getChapterName(), "Untitled chapter"))
                        .sheetName(defaultIfBlank(sheet.getSheetName(), "Study sheet"))
                        .subject(defaultIfBlank(sheet.getSubject(), "General"))
                        .weightage(chapter.getWeightage())
                        .completed(chapter.isCompleted())
                        .revised(chapter.isRevised())
                        .priorityScore(chapterPriorityService.computePriorityScore(chapter, dayType))
                        .build();

                candidates.add(candidate);
            }
        }

        candidates.sort(Comparator.comparingDouble(ChapterCandidate::getPriorityScore).reversed());
        return candidates;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private PromptChapter toPromptChapter(ChapterCandidate candidate) {
        return new PromptChapter(
                candidate.getChapterId(),
                candidate.getChapterName(),
                candidate.getSheetName(),
                candidate.getSubject(),
                candidate.getWeightage(),
                candidate.isCompleted(),
                candidate.isRevised(),
                candidate.getPriorityScore()
        );
    }

    private String toJsonSilently(Object input) {
        try {
            return objectMapper.writeValueAsString(input);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }

    private NormalizedRequest normalizeInstantRequest(InstantPlanRequestDTO request) {
        return new NormalizedRequest(
                request.getSheetId(),
                DEFAULT_AVAILABLE_MINUTES,
                DEFAULT_MAX_SESSION_MINUTES,
                DEFAULT_BREAK_MINUTES,
                DEFAULT_START_TIME,
                request.getIncludeRevision() == null || request.getIncludeRevision(),
                "none",
                ZoneId.systemDefault().getId(),
                PlanDayType.WORKDAY
        );
    }

    private NormalizedRequest normalizeCustomizedRequest(CustomizedPlanRequestDTO request) {
        int availableMinutes = request.getAvailableMinutes() == null
                ? (request.getAvailableHours() == null ? DEFAULT_AVAILABLE_MINUTES : request.getAvailableHours() * 60)
                : request.getAvailableMinutes();

        if (availableMinutes < 30) {
            availableMinutes = 30;
        }
        if (availableMinutes > 720) {
            availableMinutes = 720;
        }

        int maxSessionMinutes = request.getMaxSessionMinutes() == null
                ? DEFAULT_MAX_SESSION_MINUTES
                : request.getMaxSessionMinutes();

        int breakMinutes = request.getBreakMinutes() == null
                ? DEFAULT_BREAK_MINUTES
                : request.getBreakMinutes();

        if (maxSessionMinutes > availableMinutes) {
            maxSessionMinutes = availableMinutes;
        }

        String startTime = request.getPreferredStartTime() == null || request.getPreferredStartTime().isBlank()
                ? DEFAULT_START_TIME
                : request.getPreferredStartTime();
        try {
            LocalTime.parse(startTime, TIME_FORMAT);
        } catch (Exception ex) {
            startTime = DEFAULT_START_TIME;
        }

        String additionalInstructions = request.getCustomMessage() == null
                ? "none"
                : request.getCustomMessage().trim();
        if (additionalInstructions.isBlank()) {
            additionalInstructions = "none";
        }

        PlanDayType dayType = request.getDayType() == null ? PlanDayType.WORKDAY : request.getDayType();

        return new NormalizedRequest(
                request.getSheetId(),
                availableMinutes,
                maxSessionMinutes,
                breakMinutes,
                startTime,
                request.getIncludeRevision() == null || request.getIncludeRevision(),
                additionalInstructions,
                ZoneId.systemDefault().getId(),
                dayType
        );
    }

    private NormalizedRequest normalizeRequest(PlanMyDayRequestDTO request) {
        int availableMinutes = request.getAvailableMinutes() == null
                ? DEFAULT_AVAILABLE_MINUTES
                : request.getAvailableMinutes();

        int maxSessionMinutes = request.getMaxSessionMinutes() == null
                ? DEFAULT_MAX_SESSION_MINUTES
                : request.getMaxSessionMinutes();

        int breakMinutes = request.getBreakMinutes() == null
                ? DEFAULT_BREAK_MINUTES
                : request.getBreakMinutes();

        if (maxSessionMinutes > availableMinutes) {
            maxSessionMinutes = availableMinutes;
        }

        String startTime = request.getPreferredStartTime() == null || request.getPreferredStartTime().isBlank()
                ? DEFAULT_START_TIME
                : request.getPreferredStartTime();
        try {
            LocalTime.parse(startTime, TIME_FORMAT);
        } catch (Exception ex) {
            startTime = DEFAULT_START_TIME;
        }

        String additionalInstructions = request.getAdditionalInstructions() == null
                ? "none"
                : request.getAdditionalInstructions().trim();
        if (additionalInstructions.isBlank()) {
            additionalInstructions = "none";
        }

        return new NormalizedRequest(
                request.getSheetId(),
                availableMinutes,
                maxSessionMinutes,
                breakMinutes,
                startTime,
                request.getIncludeRevision() == null || request.getIncludeRevision(),
                additionalInstructions,
            ZoneId.systemDefault().getId(),
            PlanDayType.WORKDAY
        );
    }

    private record NormalizedRequest(
            Integer sheetId,
            int availableMinutes,
            int maxSessionMinutes,
            int breakMinutes,
            String preferredStartTime,
            boolean includeRevision,
            String additionalInstructions,
                String timezone,
                PlanDayType dayType
    ) {
    }

    private record PlannedTask(
            ChapterCandidate chapter,
            int durationMinutes,
            boolean revision,
            String reason
    ) {
    }

    @Data
    @Builder
    private static class ChapterCandidate {
        private int chapterId;
        private String chapterName;
        private String sheetName;
        private String subject;
        private double weightage;
        private boolean completed;
        private boolean revised;
        private double priorityScore;
    }

    private record PromptChapter(
            int chapterId,
            String chapterName,
            String sheetName,
            String subject,
            double weightage,
            boolean completed,
            boolean revised,
            double priorityScore
    ) {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiPlanOutput {
        private String summary;
        private List<AiTask> tasks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiTask {
        private int chapterId;
        private Integer durationMinutes;
        private boolean revision;
        private String reason;
    }
}
