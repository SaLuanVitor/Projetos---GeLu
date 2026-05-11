package br.com.gelu.menu.users.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateWeightRecordRequest(
    @NotNull @DecimalMin(value = "1.00") BigDecimal weightKg, LocalDateTime recordedAt) {}
