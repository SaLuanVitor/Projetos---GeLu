package br.com.gelu.menu.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record FamilyWeeklyGoalRequest(
    UUID familyId,
    @NotBlank(message = "Title is required") String title,
    @NotBlank(message = "Goal tag is required") String goalTag,
    Integer targetCount,
    String unit) {}
