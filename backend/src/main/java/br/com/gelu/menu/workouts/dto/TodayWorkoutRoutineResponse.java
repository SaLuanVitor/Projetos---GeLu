package br.com.gelu.menu.workouts.dto;

import java.util.List;

public record TodayWorkoutRoutineResponse(
    String dayOfWeek,
    String dayLabel,
    List<WorkoutResponse> scheduledWorkouts,
    WorkoutResponse currentWorkout,
    boolean completedToday,
    int todayCaloriesBurned,
    int todayDurationMinutes,
    int totalLoggedWorkoutsToday,
    String suggestedPreWorkoutMeal,
    String suggestedPostWorkoutMeal) {}
