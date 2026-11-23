package br.com.gelu.menu.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record WeeklyEvolutionSummaryResponse(
    String periodLabel,
    String headline,
    String overallStatus, // POSITIVO, MODERADO, ATENCAO
    String weightProgressNote,
    List<String> wentWell,
    List<String> missedOrAttention,
    List<String> recommendations,
    int workoutsCompleted,
    int totalWorkoutMinutes,
    int totalCaloriesBurned,
    int activitiesCompleted,
    BigDecimal currentWeight,
    BigDecimal weightChange,
    FamilyScopeSummary familyScope,
    List<MemberWeeklySummary> memberBreakdown) {}
