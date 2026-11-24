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
    String intensity) {}
