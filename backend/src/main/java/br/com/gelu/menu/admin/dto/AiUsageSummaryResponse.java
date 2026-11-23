package br.com.gelu.menu.admin.dto;

import java.util.List;

public record AiUsageSummaryResponse(
    long totalRequests,
    long totalTokens,
    long promptTokens,
    long completionTokens,
    String estimatedCostBrl,
    String configuredModel,
    boolean hasApiKey,
    List<AiUsageLogResponse> recentLogs) {}
