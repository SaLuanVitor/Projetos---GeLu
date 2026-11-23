package br.com.gelu.menu.diet.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateDietMealRequest(
    @NotBlank String weekDay,
    @NotBlank String mealName,
    String mealTime,
    String notes,
    UUID recipeId,
    BigDecimal servings,
    List<UUID> personUserIds,
    Integer orderIndex) {}
