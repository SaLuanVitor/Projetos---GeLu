package br.com.gelu.menu.ai.dto;

import java.util.List;

public record MealSuggestionResponse(
    String title,
    String category,
    int estimatedCalories,
    int prepTimeMinutes,
    String explanation,
    List<String> ingredients,
    String proteinGrams,
    String carbsGrams,
    String fatGrams,
    String chefTip,
    String source,
    String disclaimer,
    Double confidenceScore,
    Integer minCalories,
    Integer maxCalories,
    Boolean requiresConfirmation) {

  public MealSuggestionResponse(
      String title,
      String category,
      int estimatedCalories,
      int prepTimeMinutes,
      String explanation,
      List<String> ingredients,
      String proteinGrams,
      String carbsGrams,
      String fatGrams,
      String chefTip,
      String source,
      String disclaimer) {
    this(
        title,
        category,
        estimatedCalories,
        prepTimeMinutes,
        explanation,
        ingredients,
        proteinGrams,
        carbsGrams,
        fatGrams,
        chefTip,
        source,
        disclaimer,
        source != null && source.contains("GEMINI") ? 0.95 : 0.82,
        Math.max(0, estimatedCalories - 40),
        estimatedCalories + 40,
        false);
  }

  public MealSuggestionResponse(
      String title,
      String category,
      int estimatedCalories,
      int prepTimeMinutes,
      String explanation,
      List<String> ingredients,
      String proteinGrams,
      String carbsGrams,
      String fatGrams,
      String chefTip) {
    this(
        title,
        category,
        estimatedCalories,
        prepTimeMinutes,
        explanation,
        ingredients,
        proteinGrams,
        carbsGrams,
        fatGrams,
        chefTip,
        "LOCAL_HEURISTIC",
        "Estimativa nutricional assistiva. Não substitui orientação de nutricionista ou médico.");
  }
}
