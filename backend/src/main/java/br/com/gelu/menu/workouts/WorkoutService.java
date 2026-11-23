package br.com.gelu.menu.workouts;

import br.com.gelu.menu.audit.AuditAction;
import br.com.gelu.menu.audit.AuditLogService;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import br.com.gelu.menu.workouts.dto.CreateWorkoutLogRequest;
import br.com.gelu.menu.workouts.dto.DailyWorkoutSummaryResponse;
import br.com.gelu.menu.workouts.dto.WorkoutLogResponse;
import br.com.gelu.menu.workouts.dto.WorkoutRequest;
import br.com.gelu.menu.workouts.dto.WorkoutResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkoutService {

  private final WorkoutRepository workoutRepository;
  private final WorkoutLogRepository workoutLogRepository;
  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final AuditLogService auditLogService;

  public WorkoutService(
      WorkoutRepository workoutRepository,
      WorkoutLogRepository workoutLogRepository,
      UserRepository userRepository,
      FamilyRepository familyRepository,
      AuditLogService auditLogService) {
    this.workoutRepository = workoutRepository;
    this.workoutLogRepository = workoutLogRepository;
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.auditLogService = auditLogService;
  }

  @Transactional(readOnly = true)
  public List<WorkoutResponse> listWorkouts(UUID userId, UUID familyId) {
    List<Workout> list;
    if (familyId != null) {
      list = workoutRepository.findAllByUserIdOrFamilyId(userId, familyId);
    } else {
      list = workoutRepository.findAllByUserIdOrderByTitleAsc(userId);
    }
    return list.stream().map(WorkoutResponse::from).toList();
  }

  @Transactional
  public WorkoutResponse createWorkout(UUID userId, WorkoutRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = null;
    if (request.familyId() != null) {
      family = familyRepository.findById(request.familyId()).orElse(null);
    }

    Workout workout =
        new Workout(
            family,
            user,
            request.title(),
            request.category(),
            request.caloriesPerHour() != null ? request.caloriesPerHour() : 400,
            request.defaultDurationMinutes() != null ? request.defaultDurationMinutes() : 60,
            request.notes());

    Workout saved = workoutRepository.save(workout);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "WORKOUT",
          saved.getId().toString(),
          family != null ? family.getId() : null,
          user.getId(),
          user.getName(),
          "Cadastrou treino \"" + saved.getTitle() + "\" (" + saved.getCategory() + ")");
    }

    return WorkoutResponse.from(saved);
  }

  @Transactional
  public void deleteWorkout(UUID userId, UUID workoutId) {
    Workout workout =
        workoutRepository
            .findById(workoutId)
            .orElseThrow(() -> new NotFoundException("Workout not found"));

    if (!workout.getUser().getId().equals(userId)) {
      throw new ForbiddenException("Cannot delete someone else's workout");
    }

    workoutRepository.delete(workout);
  }

  @Transactional
  public WorkoutLogResponse logWorkout(UUID userId, CreateWorkoutLogRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = null;
    if (request.familyId() != null) {
      family = familyRepository.findById(request.familyId()).orElse(null);
    }

    Workout workout = null;
    int caloriesBurned = request.caloriesBurned() != null ? request.caloriesBurned() : 0;
    int duration = request.durationMinutes() != null ? request.durationMinutes() : 60;

    if (request.workoutId() != null) {
      workout = workoutRepository.findById(request.workoutId()).orElse(null);
      if (workout != null && caloriesBurned <= 0) {
        caloriesBurned = (workout.getCaloriesPerHour() * duration) / 60;
      }
    }

    if (caloriesBurned <= 0) {
      caloriesBurned = (400 * duration) / 60; // Padrão 400 kcal/hora
    }

    WorkoutLog log =
        new WorkoutLog(
            family,
            user,
            workout,
            request.title(),
            request.category() != null
                ? request.category()
                : (workout != null ? workout.getCategory() : "MUSCULACAO"),
            duration,
            caloriesBurned,
            request.performedAt() != null ? request.performedAt() : Instant.now(),
            request.notes());

    WorkoutLog saved = workoutLogRepository.save(log);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "WORKOUT_LOG",
          saved.getId().toString(),
          family != null ? family.getId() : null,
          user.getId(),
          user.getName(),
          "Registrou treino: "
              + saved.getTitle()
              + " ("
              + saved.getDurationMinutes()
              + " min, -"
              + saved.getCaloriesBurned()
              + " kcal)");
    }

    return WorkoutLogResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public List<WorkoutLogResponse> listWorkoutLogs(UUID userId, UUID familyId) {
    return workoutLogRepository.findAllRecent(userId, familyId).stream()
        .map(WorkoutLogResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public DailyWorkoutSummaryResponse getDailySummary(UUID userId, LocalDate date) {
    LocalDate target = date != null ? date : LocalDate.now(ZoneOffset.UTC);
    Instant start = target.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant end = target.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

    List<WorkoutLog> logs = workoutLogRepository.findAllByUserAndDateRange(userId, start, end);
    int totalCalories = logs.stream().mapToInt(WorkoutLog::getCaloriesBurned).sum();
    int totalMinutes = logs.stream().mapToInt(WorkoutLog::getDurationMinutes).sum();

    return new DailyWorkoutSummaryResponse(
        target,
        totalCalories,
        totalMinutes,
        logs.size(),
        !logs.isEmpty(),
        logs.stream().map(WorkoutLogResponse::from).toList());
  }
}
