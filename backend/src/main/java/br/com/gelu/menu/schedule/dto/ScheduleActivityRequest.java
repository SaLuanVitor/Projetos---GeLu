package br.com.gelu.menu.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record ScheduleActivityRequest(
    UUID familyId,
    @NotBlank(message = "Day of week is required") String dayOfWeek,
    @NotBlank(message = "Start time is required") String startTime,
    @NotBlank(message = "End time is required") String endTime,
    @NotBlank(message = "Title is required") String title,
    String category,
    String notes,
    String goalTag,
    UUID recipeId,
    UUID assignedToUserId,
    List<UUID> assigneeUserIds,
    Integer orderIndex) {}
