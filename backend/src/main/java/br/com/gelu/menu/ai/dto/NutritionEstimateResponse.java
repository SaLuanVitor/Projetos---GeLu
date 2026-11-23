package br.com.gelu.menu.ai.dto;

import java.math.BigDecimal;

public record NutritionEstimateResponse(
    BigDecimal totalCalories,
    BigDecimal carbohydrates,
    BigDecimal proteins,
    BigDecimal fats,
    BigDecimal fibers,
    BigDecimal sodium,
    Integer servings,
    BigDecimal caloriesPerServing,
    BigDecimal carbsPerServing,
    BigDecimal proteinPerServing,
    BigDecimal fatPerServing,
    BigDecimal fiberPerServing,
    BigDecimal sodiumPerServing,
    String source) {}
