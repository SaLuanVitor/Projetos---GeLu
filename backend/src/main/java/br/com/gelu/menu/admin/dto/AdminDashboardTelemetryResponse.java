package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminDashboardTelemetryResponse(
    // 1. Acessos & Usuários
    long totalUsers,
    long activeUsers24h,
    long activeUsers30d,
    long totalSessionsActive,
    long totalFamilies,
    long mealsLoggedToday,
    long recipesCount,
    long weeklyDietsCount,

    // 2. Alertas & Segurança
    long securityAlertsCount,
    long piiRevealsCount,
    long openTicketsCount,
    long urgentTicketsCount,

    // 3. Telemetria de IA & Orçamento
    long aiTotalRequests,
    long aiTotalTokens,
    long aiPromptTokens,
    long aiCompletionTokens,
    String aiEstimatedCostBrl,
    int aiMonthlyBudgetTokens,
    int aiBudgetUsedPercent,
    String aiConfiguredModel,
    long aiFeedbackTotal,
    long aiFeedbackPositive,
    long aiFeedbackNegative,
    double aiSatisfactionRatePercent,

    // 4. Live Health dos Serviços
    DatabaseHealthDto database,
    JvmHealthDto jvm,
    StorageHealthDto storage,
    AiServiceHealthDto aiService,
    WebSocketHealthDto websocket,

    // 5. Atividades recentes & Auditoria
    List<RecentAuditItemDto> recentSecurityEvents,
    LocalDateTime generatedAt) {

  public record DatabaseHealthDto(
      String status,
      int activeConnections,
      int idleConnections,
      int maxConnections,
      double latencyMs) {}

  public record JvmHealthDto(
      String status,
      long uptimeSeconds,
      long memoryUsedMb,
      long memoryMaxMb) {}

  public record StorageHealthDto(
      String status,
      String provider,
      String bucket) {}

  public record AiServiceHealthDto(
      String status,
      String model,
      double latencyMs,
      boolean healthy) {}

  public record WebSocketHealthDto(
      String status,
      int activeSubscriptions) {}

  public record RecentAuditItemDto(
      String id,
      String action,
      String operatorEmail,
      String details,
      LocalDateTime createdAt) {}
}
