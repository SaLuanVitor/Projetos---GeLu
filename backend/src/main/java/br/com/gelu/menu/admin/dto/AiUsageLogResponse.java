package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AiUsageLogResponse(
    UUID id,
    UUID userId,
    UUID familyId,
    String operationType,
    String modelName,
    int promptTokens,
    int completionTokens,
    int totalTokens,
    long latencyMs,
    String status,
    LocalDateTime createdAt) {}
