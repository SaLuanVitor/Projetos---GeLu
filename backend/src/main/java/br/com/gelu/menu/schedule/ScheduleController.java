package br.com.gelu.menu.schedule;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.schedule.dto.FamilyWeeklyGoalRequest;
import br.com.gelu.menu.schedule.dto.FamilyWeeklyGoalResponse;
import br.com.gelu.menu.schedule.dto.ScheduleActivityRequest;
import br.com.gelu.menu.schedule.dto.ScheduleActivityResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/schedule")
public class ScheduleController {

  private final ScheduleService scheduleService;

  public ScheduleController(ScheduleService scheduleService) {
    this.scheduleService = scheduleService;
  }

  @GetMapping("/activities")
  public ApiResponse<List<ScheduleActivityResponse>> listActivities(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId,
      @RequestParam(required = false) String dayOfWeek,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    return ApiResponse.ok(
        scheduleService.listActivities(user.id(), familyId, dayOfWeek, date),
        "Activities loaded successfully");
  }

  @PostMapping("/activities")
  public ApiResponse<ScheduleActivityResponse> createActivity(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody ScheduleActivityRequest request) {
    return ApiResponse.ok(
        scheduleService.createActivity(user.id(), request), "Activity created successfully");
  }

  @PutMapping("/activities/{id}")
  public ApiResponse<ScheduleActivityResponse> updateActivity(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @Valid @RequestBody ScheduleActivityRequest request) {
    return ApiResponse.ok(
        scheduleService.updateActivity(user.id(), id, request), "Activity updated successfully");
  }

  @DeleteMapping("/activities/{id}")
  public ApiResponse<Void> deleteActivity(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    scheduleService.deleteActivity(user.id(), id);
    return ApiResponse.ok(null, "Activity deleted successfully");
  }

  @PostMapping("/activities/{id}/toggle")
  public ApiResponse<Map<String, Boolean>> toggleCompletion(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    boolean completed = scheduleService.toggleCompletion(user.id(), id, date);
    return ApiResponse.ok(Map.of("completed", completed), "Activity completion toggled");
  }

  @GetMapping("/goals")
  public ApiResponse<List<FamilyWeeklyGoalResponse>> listGoals(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    return ApiResponse.ok(
        scheduleService.listGoals(user.id(), familyId, date), "Goals loaded successfully");
  }

  @PostMapping("/goals")
  public ApiResponse<FamilyWeeklyGoalResponse> createGoal(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody FamilyWeeklyGoalRequest request) {
    return ApiResponse.ok(
        scheduleService.createGoal(user.id(), request), "Goal created successfully");
  }

  @DeleteMapping("/goals/{id}")
  public ApiResponse<Void> deleteGoal(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    scheduleService.deleteGoal(user.id(), id);
    return ApiResponse.ok(null, "Goal deleted successfully");
  }
}
