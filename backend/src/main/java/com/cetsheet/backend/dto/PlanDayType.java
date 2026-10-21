package com.cetsheet.backend.dto;

public enum PlanDayType {
    WORKDAY(1.0),
    HOLIDAY(1.25);

    private final double priorityMultiplier;

    PlanDayType(double priorityMultiplier) {
        this.priorityMultiplier = priorityMultiplier;
    }

    public double getPriorityMultiplier() {
        return priorityMultiplier;
    }
}
