package br.com.gelu.menu.meals.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record ParseMealTextRequest(
    @NotBlank(message = "O texto da refeição é obrigatório") String text,
    String mealType,
    LocalDateTime consumedAt) {}
