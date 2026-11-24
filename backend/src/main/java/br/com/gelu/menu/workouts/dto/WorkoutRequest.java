package br.com.gelu.menu.workouts.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record WorkoutRequest(
    UUID familyId,
    @NotBlank(message = "O título do treino é obrigatório") String title,
    String category,
    Integer caloriesPerHour,
    Integer defaultDurationMinutes,
    String notes,
    String daysOfWeek,
    String exercisesJson,
    Boolean favorite,
    String intensity) {

  public WorkoutRequest(
      String title,
      String category,
      String intensity,
      Integer defaultDurationMinutes,
      Integer caloriesPerHour,
      String notes,
      String daysOfWeek,
      String exercisesJson,
      Boolean favorite) {
    this(
        null,
        title,
        category,
        caloriesPerHour,
        defaultDurationMinutes,
        notes,
        daysOfWeek,
        exercisesJson,
        favorite,
        intensity);
  }
}
