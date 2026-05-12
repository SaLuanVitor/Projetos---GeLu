package br.com.gelu.menu.recipes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import org.hibernate.validator.constraints.URL;

public record RecipeRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 2000) String description,
    @Size(max = 80) String category,
    @Min(1) Integer prepTimeMinutes,
    @Min(1) BigDecimal estimatedCalories,
    @Min(1) Integer servings,
    @Size(max = 500) @URL String videoUrl,
    @NotEmpty @Size(max = 40) List<@Valid RecipeIngredientRequest> ingredients,
    @NotEmpty @Size(max = 40) List<@Valid RecipeStepRequest> steps) {}
