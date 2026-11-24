package br.com.gelu.menu.meals.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record DailyMealChecklistItemResponse(
    UUID dietMealId,
    String mealName,
    LocalTime mealTime,
    String weekDay,
    int orderIndex,
    Double plannedCalories,
    List<String> plannedRecipes,
    String status,
    UUID mealLogId,
    String customDishName,
    String photoUrl,
    Double consumedCalories,
    Double consumedProteins,
    Double consumedCarbs,
    Double consumedFats,
    String skipReason) {}
