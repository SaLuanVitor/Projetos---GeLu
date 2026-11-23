package br.com.gelu.menu.schedule.dto;

import br.com.gelu.menu.schedule.ScheduleActivity;
import java.util.Collections;
import java.util.List;

public record ScheduleActivityResponse(
    String id,
    String familyId,
    String dayOfWeek,
    String startTime,
    String endTime,
    String title,
    String category,
    String notes,
    String goalTag,
    String recipeId,
    String recipeName,
    String assignedToUserId,
    String assignedToUserName,
    List<ScheduleAssigneeResponse> assignees,
    int orderIndex,
    boolean completedToday) {

  public static ScheduleActivityResponse from(ScheduleActivity activity, boolean completedToday) {
    List<ScheduleAssigneeResponse> assigneesList =
        activity.getAssignees() != null
            ? activity.getAssignees().stream().map(ScheduleAssigneeResponse::from).toList()
            : Collections.emptyList();

    String assignedToId = null;
    String assignedToName = null;
    if (activity.getAssignedTo() != null) {
      assignedToId = activity.getAssignedTo().getId().toString();
      assignedToName = activity.getAssignedTo().getName();
    } else if (!assigneesList.isEmpty()) {
      assignedToId = assigneesList.get(0).id();
      assignedToName = assigneesList.get(0).name();
    }

    return new ScheduleActivityResponse(
        activity.getId().toString(),
        activity.getFamily() != null ? activity.getFamily().getId().toString() : null,
        activity.getDayOfWeek(),
        activity.getStartTime(),
        activity.getEndTime(),
        activity.getTitle(),
        activity.getCategory(),
        activity.getNotes(),
        activity.getGoalTag(),
        activity.getRecipe() != null ? activity.getRecipe().getId().toString() : null,
        activity.getRecipe() != null ? activity.getRecipe().getName() : null,
        assignedToId,
        assignedToName,
        assigneesList,
        activity.getOrderIndex(),
        completedToday);
  }
}
