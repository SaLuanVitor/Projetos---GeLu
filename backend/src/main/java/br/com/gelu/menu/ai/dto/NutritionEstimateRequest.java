package br.com.gelu.menu.ai.dto;

import java.util.List;

public record NutritionEstimateRequest(
    String name, String category, Integer servings, List<NutritionIngredientItem> ingredients) {}
