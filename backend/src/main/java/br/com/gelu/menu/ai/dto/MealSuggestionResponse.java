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
    String chefTip
) {}
