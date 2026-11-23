package br.com.gelu.menu.workouts.dto;

import br.com.gelu.menu.workouts.Workout;
import java.time.Instant;
import java.util.UUID;

public record WorkoutResponse(
    UUID id,
    UUID familyId,
    UUID userId,
    String title,
    String category,
    int caloriesPerHour,
    int defaultDurationMinutes,
    String notes,
    Instant createdAt) {
  public static WorkoutResponse from(Workout w) {
    return new WorkoutResponse(
        w.getId(),
        w.getFamily() != null ? w.getFamily().getId() : null,
        w.getUser().getId(),
        w.getTitle(),
        w.getCategory(),
        w.getCaloriesPerHour(),
        w.getDefaultDurationMinutes(),
        w.getNotes(),
        w.getCreatedAt());
  }
}
