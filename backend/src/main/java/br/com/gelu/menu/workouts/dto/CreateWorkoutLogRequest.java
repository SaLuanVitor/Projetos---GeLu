package br.com.gelu.menu.workouts.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public record CreateWorkoutLogRequest(
    UUID familyId,
    UUID workoutId,
    @NotBlank(message = "O nome da atividade é obrigatório")
    String title,
    String category,
    Integer durationMinutes,
    Integer caloriesBurned,
    Instant performedAt,
    String notes
) {}
