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
    String source,
    String disclaimer,
    Double confidenceScore,
    BigDecimal minCalories,
    BigDecimal maxCalories,
    Boolean requiresConfirmation) {

  public NutritionEstimateResponse(
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
      String source,
      String disclaimer) {
    this(
        totalCalories,
        carbohydrates,
        proteins,
        fats,
        fibers,
        sodium,
        servings,
        caloriesPerServing,
        carbsPerServing,
        proteinPerServing,
        fatPerServing,
        fiberPerServing,
        sodiumPerServing,
        source,
        disclaimer,
        source != null && source.contains("GEMINI") ? 0.95 : 0.88,
        totalCalories != null ? totalCalories.multiply(BigDecimal.valueOf(0.9)).setScale(1, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO,
        totalCalories != null ? totalCalories.multiply(BigDecimal.valueOf(1.1)).setScale(1, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO,
        false);
  }

  public NutritionEstimateResponse(
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
      String source) {
    this(
        totalCalories,
        carbohydrates,
        proteins,
        fats,
        fibers,
        sodium,
        servings,
        caloriesPerServing,
        carbsPerServing,
        proteinPerServing,
        fatPerServing,
        fiberPerServing,
        sodiumPerServing,
        source,
        "Estimativa nutricional automatizada. Não substitui consulta médica ou de nutricionista.");
  }
}
