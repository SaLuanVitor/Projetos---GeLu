package br.com.gelu.menu.recipes.dto;

import jakarta.validation.constraints.NotNull;

public record RecipeFavoriteRequest(@NotNull Boolean favorite) {}
