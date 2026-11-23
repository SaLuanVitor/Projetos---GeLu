package br.com.gelu.menu.meals.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DailyMealSummaryResponse(
    LocalDate date,
    BigDecimal totalCalories,
    BigDecimal totalProteins,
    BigDecimal totalCarbohydrates,
    BigDecimal totalFats,
    BigDecimal totalFibers,
    BigDecimal totalSodium,
    int mealCount,
    List<MealLogResponse> meals) {}
