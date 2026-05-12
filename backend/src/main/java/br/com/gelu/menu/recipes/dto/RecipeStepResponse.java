package br.com.gelu.menu.recipes.dto;

import java.util.UUID;

public record RecipeStepResponse(UUID id, int position, String instruction) {}
