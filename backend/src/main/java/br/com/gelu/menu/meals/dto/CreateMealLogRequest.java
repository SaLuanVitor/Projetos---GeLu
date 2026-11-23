package br.com.gelu.menu.meals.dto;

import br.com.gelu.menu.meals.FoodItemIdentified;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateMealLogRequest(
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
    LocalDateTime consumedAt) {}
