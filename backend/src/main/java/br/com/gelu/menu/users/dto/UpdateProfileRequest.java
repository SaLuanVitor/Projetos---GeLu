package br.com.gelu.menu.users.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateProfileRequest(
    @NotBlank @Size(max = 150) String name,
    LocalDate birthDate,
    @DecimalMin(value = "1.00") BigDecimal heightCm,
    @Size(max = 20) String biologicalSex,
    @Size(max = 80) String goal,
    @DecimalMin(value = "1.00") BigDecimal basalCalories,
    @DecimalMin(value = "1.00") BigDecimal dailyCalorieGoal) {}
