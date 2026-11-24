package br.com.gelu.menu.recipes.dto;

import java.math.BigDecimal;

public record RecipeSearchFilter(
    String query,
    String ingredient,
    String category,
    Integer maxPrepTimeMinutes,
    BigDecimal maxCalories,
    Boolean favorite) {

  public RecipeSearchFilter(
      String query,
      String ingredient,
      String category,
      Integer maxPrepTimeMinutes,
      BigDecimal maxCalories) {
    this(query, ingredient, category, maxPrepTimeMinutes, maxCalories, null);
  }
}
