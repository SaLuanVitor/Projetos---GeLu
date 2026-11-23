package br.com.gelu.menu.workouts.dto;

import br.com.gelu.menu.workouts.WorkoutLog;
import java.time.Instant;
import java.util.UUID;

public record WorkoutLogResponse(
    UUID id,
    UUID familyId,
    UUID userId,
    String userName,
    UUID workoutId,
    String title,
    String category,
    int durationMinutes,
    int caloriesBurned,
    Instant performedAt,
    String notes,
    boolean completed,
    Instant createdAt
) {
  public static WorkoutLogResponse from(WorkoutLog log) {
    return new WorkoutLogResponse(
        log.getId(),
        log.getFamily() != null ? log.getFamily().getId() : null,
        log.getUser().getId(),
        log.getUser().getName(),
        log.getWorkout() != null ? log.getWorkout().getId() : null,
        log.getTitle(),
        log.getCategory(),
        log.getDurationMinutes(),
        log.getCaloriesBurned(),
        log.getPerformedAt(),
        log.getNotes(),
        log.isCompleted(),
        log.getCreatedAt());
  }
}
