package br.com.gelu.menu.recipes.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecipeResponse(
    UUID id,
    String name,
    String description,
    String category,
    Integer prepTimeMinutes,
    BigDecimal estimatedCalories,
    Integer servings,
    String videoUrl,
    List<RecipeIngredientResponse> ingredients,
    List<RecipeStepResponse> steps,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
