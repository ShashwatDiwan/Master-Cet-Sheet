package com.cetsheet.backend.Services;

import com.cetsheet.backend.dto.ChapterDTO;
import com.cetsheet.backend.dto.PlanDayType;
import org.springframework.stereotype.Service;

@Service
public class ChapterPriorityService {

    public double computePriorityScore(ChapterDTO chapter, PlanDayType dayType) {
        PlanDayType effectiveDayType = dayType == null ? PlanDayType.WORKDAY : dayType;

        double score = Math.max(1.0, chapter.getWeightage()) * 100.0;
        if (!chapter.isCompleted()) {
            score += 50.0 * effectiveDayType.getPriorityMultiplier();
        }
        if (!chapter.isRevised()) {
            score += 20.0;
        }
        return score;
    }
}
