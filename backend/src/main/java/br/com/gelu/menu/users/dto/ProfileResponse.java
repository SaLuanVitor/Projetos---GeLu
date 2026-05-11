package br.com.gelu.menu.users.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProfileResponse(
    UUID id,
    String name,
    String email,
    LocalDate birthDate,
    BigDecimal heightCm,
    BigDecimal currentWeight,
    String biologicalSex,
    String goal,
    BigDecimal basalCalories,
    BigDecimal dailyCalorieGoal,
    boolean active,
    LocalDateTime createdAt) {}
