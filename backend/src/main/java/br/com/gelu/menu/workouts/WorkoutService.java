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
import br.com.gelu.menu.workouts.dto.TodayWorkoutRoutineResponse;
import br.com.gelu.menu.workouts.dto.WorkoutLogResponse;
import br.com.gelu.menu.workouts.dto.WorkoutRequest;
import br.com.gelu.menu.workouts.dto.WorkoutResponse;
import java.time.DayOfWeek;
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
      list = workoutRepository.findAllByUserIdSorted(userId);
    }
    return list.stream().map(WorkoutResponse::from).toList();
  }

  @Transactional
  public WorkoutResponse createWorkout(UUID userId, WorkoutRequest request) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

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
            request.notes(),
            request.daysOfWeek(),
            request.exercisesJson(),
            request.favorite() != null ? request.favorite() : false,
            request.intensity());

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
  public WorkoutResponse updateWorkout(UUID userId, UUID workoutId, WorkoutRequest request) {
    Workout workout =
        workoutRepository
            .findById(workoutId)
            .orElseThrow(() -> new NotFoundException("Workout not found"));

    if (!workout.getUser().getId().equals(userId)) {
      throw new ForbiddenException("Cannot edit someone else's workout");
    }

    workout.update(
        request.title(),
        request.category(),
        request.caloriesPerHour() != null ? request.caloriesPerHour() : 400,
        request.defaultDurationMinutes() != null ? request.defaultDurationMinutes() : 60,
        request.notes(),
        request.daysOfWeek(),
        request.exercisesJson(),
        request.favorite(),
        request.intensity());

    Workout saved = workoutRepository.save(workout);
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
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

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

  @Transactional(readOnly = true)
  public TodayWorkoutRoutineResponse getTodayRoutine(UUID userId, UUID familyId) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    DayOfWeek dayOfWeek = today.getDayOfWeek();
    String dayKey = getDayKey(dayOfWeek);
    String dayLabel = getDayLabel(dayOfWeek);

    List<Workout> userWorkouts;
    if (familyId != null) {
      userWorkouts = workoutRepository.findAllByUserIdOrFamilyId(userId, familyId);
    } else {
      userWorkouts = workoutRepository.findAllByUserIdSorted(userId);
    }

    // Filtra os treinos agendados para hoje
    List<Workout> scheduled =
        userWorkouts.stream()
            .filter(
                w -> {
                  if (w.getDaysOfWeek() == null || w.getDaysOfWeek().isBlank()) return false;
                  String days = w.getDaysOfWeek().toUpperCase();
                  return days.contains(dayKey)
                      || days.contains(dayOfWeek.name())
                      || days.contains(dayLabel.toUpperCase());
                })
            .toList();

    Instant start = today.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
    List<WorkoutLog> todayLogs = workoutLogRepository.findAllByUserAndDateRange(userId, start, end);

    int totalCalories = todayLogs.stream().mapToInt(WorkoutLog::getCaloriesBurned).sum();
    int totalMinutes = todayLogs.stream().mapToInt(WorkoutLog::getDurationMinutes).sum();
    boolean completedToday = !todayLogs.isEmpty();

    Workout current = scheduled.isEmpty() ? null : scheduled.get(0);

    // Sugestões inteligentes de pré e pós treino
    String preMeal = "Banana com aveia, pasta de amendoim ou torrada integral 40min antes.";
    String postMeal = "Ovos mexidos cremosos, frango com arroz ou shake proteico para recuperação.";

    return new TodayWorkoutRoutineResponse(
        dayKey,
        dayLabel,
        scheduled.stream().map(WorkoutResponse::from).toList(),
        current != null ? WorkoutResponse.from(current) : null,
        completedToday,
        totalCalories,
        totalMinutes,
        todayLogs.size(),
        preMeal,
        postMeal);
  }

  @Transactional
  public WorkoutLogResponse completeRoutineWorkout(UUID userId, UUID workoutId, String notes) {
    return completeRoutineWorkout(userId, workoutId, notes, null, null);
  }

  @Transactional
  public WorkoutLogResponse completeRoutineWorkout(
      UUID userId, UUID workoutId, String notes, Integer customDuration, Integer customCalories) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

    Workout workout =
        workoutRepository
            .findById(workoutId)
            .orElseThrow(() -> new NotFoundException("Workout not found"));

    Family family = workout.getFamily();
    int duration = (customDuration != null && customDuration > 0)
        ? customDuration
        : workout.getDefaultDurationMinutes();
    int caloriesBurned = (customCalories != null && customCalories > 0)
        ? customCalories
        : (workout.getCaloriesPerHour() * duration) / 60;
    if (caloriesBurned <= 0) {
      caloriesBurned = (400 * duration) / 60;
    }

    String logNotes =
        notes != null && !notes.isBlank()
            ? notes
            : "Treino da rotina diária concluído (" + workout.getTitle() + ")";

    WorkoutLog log =
        new WorkoutLog(
            family,
            user,
            workout,
            workout.getTitle(),
            workout.getCategory(),
            duration,
            caloriesBurned,
            Instant.now(),
            logNotes);

    WorkoutLog saved = workoutLogRepository.save(log);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "WORKOUT_LOG",
          saved.getId().toString(),
          family != null ? family.getId() : null,
          user.getId(),
          user.getName(),
          "Concluiu treino da rotina: "
              + saved.getTitle()
              + " ("
              + saved.getDurationMinutes()
              + " min, -"
              + saved.getCaloriesBurned()
              + " kcal)");
    }

    return WorkoutLogResponse.from(saved);
  }

  private String getDayKey(DayOfWeek day) {
    return switch (day) {
      case MONDAY -> "SEG";
      case TUESDAY -> "TER";
      case WEDNESDAY -> "QUA";
      case THURSDAY -> "QUI";
      case FRIDAY -> "SEX";
      case SATURDAY -> "SAB";
      case SUNDAY -> "DOM";
    };
  }

  private String getDayLabel(DayOfWeek day) {
    return switch (day) {
      case MONDAY -> "Segunda-feira";
      case TUESDAY -> "Terça-feira";
      case WEDNESDAY -> "Quarta-feira";
      case THURSDAY -> "Quinta-feira";
      case FRIDAY -> "Sexta-feira";
      case SATURDAY -> "Sábado";
      case SUNDAY -> "Domingo";
    };
  }
}
