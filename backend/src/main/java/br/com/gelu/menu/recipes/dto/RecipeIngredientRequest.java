package br.com.gelu.menu.recipes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecipeIngredientRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 80) String quantity,
    @Size(max = 40) String unit) {}
