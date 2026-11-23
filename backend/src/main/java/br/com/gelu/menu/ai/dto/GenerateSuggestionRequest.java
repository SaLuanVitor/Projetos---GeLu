package br.com.gelu.menu.ai.dto;

import java.util.List;

public record GenerateSuggestionRequest(
    String mealType,
    String goal,
    Integer targetCalories,
    String preferences,
    String restrictions
) {}
