package br.com.gelu.menu.ai.dto;

public record GenerateSuggestionRequest(
    String mealType,
    String goal,
    Integer targetCalories,
    String preferences,
    String restrictions) {}
