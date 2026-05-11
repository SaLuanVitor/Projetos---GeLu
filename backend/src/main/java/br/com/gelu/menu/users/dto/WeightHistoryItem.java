package br.com.gelu.menu.users.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record WeightHistoryItem(
    UUID id, BigDecimal weightKg, LocalDateTime recordedAt, LocalDateTime createdAt) {}
