package br.com.gelu.menu.recipes.dto;

import java.math.BigDecimal;

public record RecipeSearchFilter(
    String query,
    String ingredient,
    String category,
    Integer maxPrepTimeMinutes,
    BigDecimal maxCalories) {}
