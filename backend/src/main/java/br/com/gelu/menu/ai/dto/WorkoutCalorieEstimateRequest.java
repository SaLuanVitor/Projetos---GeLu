package br.com.gelu.menu.ai.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record WorkoutCalorieEstimateRequest(
    @NotBlank String activity,
    @Min(1) Integer durationMinutes,
    String intensity,
    BigDecimal userWeightKg) {}
