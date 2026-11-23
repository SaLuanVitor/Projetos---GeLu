package br.com.gelu.menu.workouts.dto;

import java.time.LocalDate;
import java.util.List;

public record DailyWorkoutSummaryResponse(
    LocalDate date,
    int totalCaloriesBurned,
    int totalDurationMinutes,
    int workoutCount,
    boolean completedToday,
    List<WorkoutLogResponse> logs
) {}
