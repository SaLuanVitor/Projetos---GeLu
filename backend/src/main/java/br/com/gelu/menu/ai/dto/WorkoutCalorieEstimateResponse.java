package br.com.gelu.menu.ai.dto;

public record WorkoutCalorieEstimateResponse(
    String activity,
    int durationMinutes,
    int estimatedCalories,
    int caloriesPerHour,
    double met,
    double userWeightKg,
    String intensity,
    String explanation,
    String source) {}
