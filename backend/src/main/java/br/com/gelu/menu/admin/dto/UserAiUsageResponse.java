package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserAiUsageResponse(
    UUID userId,
    String userName,
    String userEmail,
    UUID familyId,
    String familyName,
    long requestCount,
    long promptTokens,
    long completionTokens,
    long totalTokens,
    String estimatedCostBrl,
    LocalDateTime lastUsedAt) {}
