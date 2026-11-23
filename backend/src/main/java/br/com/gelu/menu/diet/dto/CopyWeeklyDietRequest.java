package br.com.gelu.menu.diet.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CopyWeeklyDietRequest(@NotNull LocalDate targetWeekStart) {}
