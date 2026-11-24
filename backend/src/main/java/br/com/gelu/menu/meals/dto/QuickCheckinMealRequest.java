package br.com.gelu.menu.meals.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record QuickCheckinMealRequest(
    @NotNull(message = "O ID da refeição planejada é obrigatório") UUID dietMealId,
    LocalDate date,
    String status,
    String skipReason) {}
