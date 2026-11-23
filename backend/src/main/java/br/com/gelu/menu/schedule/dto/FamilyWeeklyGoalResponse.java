package br.com.gelu.menu.schedule.dto;

import br.com.gelu.menu.schedule.FamilyWeeklyGoal;

public record FamilyWeeklyGoalResponse(
    String id,
    String familyId,
    String title,
    String goalTag,
    int targetCount,
    String unit,
    int currentCount,
    double progressPercent) {

  public static FamilyWeeklyGoalResponse from(FamilyWeeklyGoal goal, int currentCount) {
    int target = Math.max(1, goal.getTargetCount());
    double progress = Math.min(100.0, ((double) currentCount / target) * 100.0);
    return new FamilyWeeklyGoalResponse(
        goal.getId().toString(),
        goal.getFamily() != null ? goal.getFamily().getId().toString() : null,
        goal.getTitle(),
        goal.getGoalTag(),
        goal.getTargetCount(),
        goal.getUnit(),
        currentCount,
        progress);
  }
}
