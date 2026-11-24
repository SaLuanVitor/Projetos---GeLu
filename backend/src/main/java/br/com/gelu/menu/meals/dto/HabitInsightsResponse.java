package br.com.gelu.menu.meals.dto;

import java.util.List;

public record HabitInsightsResponse(
    double adherenceRate,
    int totalPlannedMeals,
    int plannedConsumedCount,
    int customConsumedCount,
    int skippedCount,
    List<StapleMealHabit> stapleMeals,
    String aiCoachingTip) {

  public record StapleMealHabit(
      String dishName,
      String mealType,
      long timesLogged,
      Double averageCalories,
      Double averageProteins) {}
}
