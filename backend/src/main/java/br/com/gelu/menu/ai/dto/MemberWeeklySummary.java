package br.com.gelu.menu.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public record MemberWeeklySummary(
    String userId,
    String userName,
    String role,
    int workoutsCount,
    int totalMinutes,
    int caloriesBurned,
    BigDecimal currentWeight,
    BigDecimal weightChange,
    List<String> wentWell,
    List<String> missedOrAttention,
    List<String> recommendations) {}
