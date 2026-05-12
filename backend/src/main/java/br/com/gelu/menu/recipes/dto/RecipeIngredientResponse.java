package br.com.gelu.menu.recipes.dto;

import java.util.UUID;

public record RecipeIngredientResponse(
    UUID id, int position, String name, String quantity, String unit) {}
