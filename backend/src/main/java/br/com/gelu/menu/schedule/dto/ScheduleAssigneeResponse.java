package br.com.gelu.menu.schedule.dto;

import br.com.gelu.menu.users.User;

public record ScheduleAssigneeResponse(String id, String name, String email) {

  public static ScheduleAssigneeResponse from(User user) {
    if (user == null) {
      return null;
    }
    return new ScheduleAssigneeResponse(user.getId().toString(), user.getName(), user.getEmail());
  }
}
