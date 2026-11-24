package br.com.gelu.menu.meals.dto;

import br.com.gelu.menu.meals.FoodItemIdentified;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MealLogResponse(
    UUID id,
    UUID userId,
    UUID familyId,
    UUID dietMealId,
    String mealType,
    String dishName,
    String photoUrl,
    BigDecimal totalCalories,
    BigDecimal proteins,
    BigDecimal carbohydrates,
    BigDecimal fats,
    BigDecimal fibers,
    BigDecimal sodium,
    List<FoodItemIdentified> items,
    String aiNotes,
    String status,
    String inputMethod,
    String rawInputText,
    String skipReason,
    LocalDateTime consumedAt,
    LocalDateTime createdAt) {}
