package br.com.gelu.menu.recipes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecipeStepRequest(@NotBlank @Size(max = 1200) String instruction) {}
