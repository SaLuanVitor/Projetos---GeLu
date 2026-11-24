package br.com.gelu.menu.workouts;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.workouts.dto.CreateWorkoutLogRequest;
import br.com.gelu.menu.workouts.dto.DailyWorkoutSummaryResponse;
import br.com.gelu.menu.workouts.dto.TodayWorkoutRoutineResponse;
import br.com.gelu.menu.workouts.dto.WorkoutLogResponse;
import br.com.gelu.menu.workouts.dto.WorkoutRequest;
import br.com.gelu.menu.workouts.dto.WorkoutResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
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
@RequestMapping("/api/v1/workouts")
public class WorkoutController {

  private final WorkoutService workoutService;

  public WorkoutController(WorkoutService workoutService) {
    this.workoutService = workoutService;
  }

  @GetMapping
  public ApiResponse<List<WorkoutResponse>> listWorkouts(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId) {
    return ApiResponse.ok(
        workoutService.listWorkouts(user.id(), familyId), "Workouts loaded successfully");
  }

  @PostMapping
  public ApiResponse<WorkoutResponse> createWorkout(
      @AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody WorkoutRequest request) {
    return ApiResponse.ok(
        workoutService.createWorkout(user.id(), request), "Workout created successfully");
  }

  @PutMapping("/{id}")
  public ApiResponse<WorkoutResponse> updateWorkout(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @Valid @RequestBody WorkoutRequest request) {
    return ApiResponse.ok(
        workoutService.updateWorkout(user.id(), id, request), "Workout updated successfully");
  }

  @GetMapping("/today")
  public ApiResponse<TodayWorkoutRoutineResponse> getTodayRoutine(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId) {
    return ApiResponse.ok(
        workoutService.getTodayRoutine(user.id(), familyId), "Today routine loaded successfully");
  }

  @PostMapping("/{id}/complete")
  public ApiResponse<WorkoutLogResponse> completeRoutineWorkout(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestParam(required = false) String notes,
      @RequestParam(required = false) Integer durationMinutes,
      @RequestParam(required = false) Integer caloriesBurned) {
    return ApiResponse.ok(
        workoutService.completeRoutineWorkout(user.id(), id, notes, durationMinutes, caloriesBurned),
        "Routine workout completed successfully");
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteWorkout(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    workoutService.deleteWorkout(user.id(), id);
    return ApiResponse.ok(null, "Workout deleted successfully");
  }

  @PostMapping("/logs")
  public ApiResponse<WorkoutLogResponse> logWorkout(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateWorkoutLogRequest request) {
    return ApiResponse.ok(
        workoutService.logWorkout(user.id(), request), "Workout logged successfully");
  }

  @GetMapping("/logs")
  public ApiResponse<List<WorkoutLogResponse>> listWorkoutLogs(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId) {
    return ApiResponse.ok(
        workoutService.listWorkoutLogs(user.id(), familyId), "Workout logs loaded successfully");
  }

  @GetMapping("/daily-summary")
  public ApiResponse<DailyWorkoutSummaryResponse> getDailySummary(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    return ApiResponse.ok(
        workoutService.getDailySummary(user.id(), date),
        "Daily workout summary loaded successfully");
  }
}
