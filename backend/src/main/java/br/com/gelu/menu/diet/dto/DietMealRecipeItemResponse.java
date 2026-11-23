package br.com.gelu.menu.diet.dto;

import java.math.BigDecimal;

public record DietMealRecipeItemResponse(
    String id,
    String recipeId,
    String recipeName,
    BigDecimal servings,
    BigDecimal caloriesPerServing,
    BigDecimal totalCalories,
    Integer prepTimeMinutes,
    String category) {}
