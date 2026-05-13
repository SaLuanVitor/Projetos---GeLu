package br.com.gelu.menu.recipes.dto;

import br.com.gelu.menu.recipes.RecipeMainMediaType;
import jakarta.validation.constraints.NotNull;

public record RecipeMainMediaTypeRequest(@NotNull RecipeMainMediaType mainMediaType) {}
