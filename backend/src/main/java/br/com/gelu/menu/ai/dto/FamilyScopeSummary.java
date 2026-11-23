package br.com.gelu.menu.ai.dto;

import java.util.List;

public record FamilyScopeSummary(
    String familyName,
    int collectiveActivitiesCount,
    List<String> wentWell,
    List<String> missedOrAttention,
    List<String> recommendations
) {}
