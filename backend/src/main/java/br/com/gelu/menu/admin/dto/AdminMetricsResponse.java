package br.com.gelu.menu.admin.dto;

public record AdminMetricsResponse(
    long totalUsers,
    long totalFamilies,
    long totalRecipes,
    long totalWeeklyDiets,
    long totalWorkoutsLogged,
    long totalAuditLogs,
    long openSupportTickets
) {}
