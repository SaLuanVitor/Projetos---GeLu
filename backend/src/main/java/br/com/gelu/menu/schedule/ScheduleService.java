package br.com.gelu.menu.schedule;

import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.common.realtime.RealtimeEventPublisher;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMember;
import br.com.gelu.menu.family.FamilyMemberRepository;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.family.FamilyRole;
import br.com.gelu.menu.recipes.Recipe;
import br.com.gelu.menu.recipes.RecipeRepository;
import br.com.gelu.menu.schedule.dto.FamilyWeeklyGoalRequest;
import br.com.gelu.menu.schedule.dto.FamilyWeeklyGoalResponse;
import br.com.gelu.menu.schedule.dto.ScheduleActivityRequest;
import br.com.gelu.menu.schedule.dto.ScheduleActivityResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleService {

  private final ScheduleActivityRepository activityRepository;
  private final ScheduleCompletionRepository completionRepository;
  private final FamilyWeeklyGoalRepository goalRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final RecipeRepository recipeRepository;
  private final UserRepository userRepository;
  private final RealtimeEventPublisher eventPublisher;

  public ScheduleService(
      ScheduleActivityRepository activityRepository,
      ScheduleCompletionRepository completionRepository,
      FamilyWeeklyGoalRepository goalRepository,
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      RecipeRepository recipeRepository,
      UserRepository userRepository,
      RealtimeEventPublisher eventPublisher) {
    this.activityRepository = activityRepository;
    this.completionRepository = completionRepository;
    this.goalRepository = goalRepository;
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.recipeRepository = recipeRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional(readOnly = true)
  public List<ScheduleActivityResponse> listActivities(
      UUID userId, UUID familyId, String dayOfWeek, LocalDate date) {
    LocalDate targetDate = date != null ? date : LocalDate.now();

    List<ScheduleActivity> activities;
    List<ScheduleCompletion> completions;

    if (familyId != null) {
      ensureFamilyMember(familyId, userId);
      activities =
          (dayOfWeek != null && !dayOfWeek.isBlank())
              ? activityRepository.findByFamilyIdAndDayOfWeek(familyId, dayOfWeek.toUpperCase())
              : activityRepository.findAllByFamilyId(familyId);
      completions = completionRepository.findByFamilyAndDateRange(familyId, targetDate, targetDate);
    } else {
      // Modo individual / pessoal
      activities =
          (dayOfWeek != null && !dayOfWeek.isBlank())
              ? activityRepository.findByUserIdAndFamilyIsNullAndDayOfWeek(userId, dayOfWeek.toUpperCase())
              : activityRepository.findAllByUserIdAndFamilyIsNull(userId);
      completions = completionRepository.findByUserIdAndDateRange(userId, targetDate, targetDate);
    }

    Set<UUID> completedIds =
        completions.stream().map(c -> c.getActivity().getId()).collect(Collectors.toSet());

    return activities.stream()
        .map(a -> ScheduleActivityResponse.from(a, completedIds.contains(a.getId())))
        .toList();
  }

  @Transactional
  public ScheduleActivityResponse createActivity(UUID userId, ScheduleActivityRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = null;
    if (request.familyId() != null) {
      FamilyMember member = ensureFamilyMember(request.familyId(), userId);
      if (member.getRole() == FamilyRole.VIEWER) {
        throw new ForbiddenException("Viewers cannot create activities");
      }
      family =
          familyRepository
              .findById(request.familyId())
              .orElseThrow(() -> new NotFoundException("Family not found"));
    }

    Recipe recipe = null;
    if (request.recipeId() != null) {
      recipe = recipeRepository.findById(request.recipeId()).orElse(null);
    }

    Set<User> resolvedAssignees = new HashSet<>();
    if (request.assigneeUserIds() != null && !request.assigneeUserIds().isEmpty()) {
      resolvedAssignees.addAll(userRepository.findAllById(request.assigneeUserIds()));
    } else if (request.assignedToUserId() != null) {
      userRepository.findById(request.assignedToUserId()).ifPresent(resolvedAssignees::add);
    }

    // Se nenhuma pessoa atribuída, atribui automaticamente ao usuário
    if (resolvedAssignees.isEmpty()) {
      resolvedAssignees.add(user);
    }

    int order = request.orderIndex() != null ? request.orderIndex() : 0;
    ScheduleActivity activity =
        new ScheduleActivity(
            family,
            user,
            request.dayOfWeek(),
            request.startTime(),
            request.endTime(),
            request.title().trim(),
            request.category(),
            request.notes(),
            request.goalTag(),
            recipe,
            resolvedAssignees.iterator().next(),
            order);

    activity.setAssignees(resolvedAssignees);

    ScheduleActivity saved = activityRepository.save(activity);
    ScheduleActivityResponse response = ScheduleActivityResponse.from(saved, false);
    if (family != null) {
      eventPublisher.publishFamilyEvent(family.getId(), "SCHEDULE_ACTIVITY_CREATED", response);
    }
    return response;
  }

  @Transactional
  public ScheduleActivityResponse updateActivity(
      UUID userId, UUID activityId, ScheduleActivityRequest request) {
    ScheduleActivity activity =
        activityRepository
            .findById(activityId)
            .orElseThrow(() -> new NotFoundException("Activity not found"));

    if (activity.getFamily() != null) {
      FamilyMember member = ensureFamilyMember(activity.getFamily().getId(), userId);
      if (member.getRole() == FamilyRole.VIEWER) {
        throw new ForbiddenException("Viewers cannot edit activities");
      }
    } else {
      if (activity.getUser() != null && !activity.getUser().getId().equals(userId)) {
        throw new ForbiddenException("You cannot edit this personal activity");
      }
    }

    Recipe recipe = null;
    if (request.recipeId() != null) {
      recipe = recipeRepository.findById(request.recipeId()).orElse(null);
    }

    Set<User> resolvedAssignees = new HashSet<>();
    if (request.assigneeUserIds() != null && !request.assigneeUserIds().isEmpty()) {
      resolvedAssignees.addAll(userRepository.findAllById(request.assigneeUserIds()));
    } else if (request.assignedToUserId() != null) {
      userRepository.findById(request.assignedToUserId()).ifPresent(resolvedAssignees::add);
    } else {
      resolvedAssignees.addAll(activity.getAssignees());
    }

    User primaryAssignee =
        !resolvedAssignees.isEmpty() ? resolvedAssignees.iterator().next() : null;

    int order = request.orderIndex() != null ? request.orderIndex() : activity.getOrderIndex();

    activity.update(
        request.dayOfWeek(),
        request.startTime(),
        request.endTime(),
        request.title().trim(),
        request.category(),
        request.notes(),
        request.goalTag(),
        recipe,
        primaryAssignee,
        order);

    activity.setAssignees(resolvedAssignees);

    ScheduleActivity saved = activityRepository.save(activity);
    boolean completedToday =
        completionRepository.existsByActivityIdAndCompletionDate(activityId, LocalDate.now());
    return ScheduleActivityResponse.from(saved, completedToday);
  }

  @Transactional
  public void deleteActivity(UUID userId, UUID activityId) {
    ScheduleActivity activity =
        activityRepository
            .findById(activityId)
            .orElseThrow(() -> new NotFoundException("Activity not found"));

    if (activity.getFamily() != null) {
      FamilyMember member = ensureFamilyMember(activity.getFamily().getId(), userId);
      if (member.getRole() == FamilyRole.VIEWER) {
        throw new ForbiddenException("Viewers cannot delete activities");
      }
    } else {
      if (activity.getUser() != null && !activity.getUser().getId().equals(userId)) {
        throw new ForbiddenException("You cannot delete this personal activity");
      }
    }

    activityRepository.delete(activity);
  }

  @Transactional
  public boolean toggleCompletion(UUID userId, UUID activityId, LocalDate date) {
    ScheduleActivity activity =
        activityRepository
            .findById(activityId)
            .orElseThrow(() -> new NotFoundException("Activity not found"));

    if (activity.getFamily() != null) {
      ensureFamilyMember(activity.getFamily().getId(), userId);
    }

    LocalDate targetDate = date != null ? date : LocalDate.now();
    boolean exists =
        completionRepository.existsByActivityIdAndCompletionDate(activityId, targetDate);

    boolean result;
    if (exists) {
      completionRepository.deleteByActivityIdAndCompletionDate(activityId, targetDate);
      result = false;
    } else {
      User user =
          userRepository
              .findById(userId)
              .orElseThrow(() -> new NotFoundException("User not found"));
      completionRepository.save(new ScheduleCompletion(activity, targetDate, user));
      result = true;
    }

    if (activity.getFamily() != null) {
      eventPublisher.publishFamilyEvent(
          activity.getFamily().getId(),
          "SCHEDULE_TASK_TOGGLED",
          java.util.Map.of(
              "activityId", activityId.toString(),
              "date", targetDate.toString(),
              "completed", result));
    }
    return result;
  }

  @Transactional(readOnly = true)
  public List<FamilyWeeklyGoalResponse> listGoals(
      UUID userId, UUID familyId, LocalDate referenceDate) {
    LocalDate ref = referenceDate != null ? referenceDate : LocalDate.now();
    LocalDate weekStart = ref.with(DayOfWeek.MONDAY);
    LocalDate weekEnd = ref.with(DayOfWeek.SUNDAY);

    List<FamilyWeeklyGoal> goals;
    List<ScheduleCompletion> completions;

    if (familyId != null) {
      ensureFamilyMember(familyId, userId);
      goals = goalRepository.findAllByFamilyId(familyId);
      completions = completionRepository.findByFamilyAndDateRange(familyId, weekStart, weekEnd);
    } else {
      goals = goalRepository.findAllByUserIdAndFamilyIsNull(userId);
      completions = completionRepository.findByUserIdAndDateRange(userId, weekStart, weekEnd);
    }

    return goals.stream()
        .map(
            goal -> {
              long count =
                  completions.stream()
                      .filter(
                          c ->
                              c.getActivity().getGoalTag() != null
                                  && c.getActivity()
                                      .getGoalTag()
                                      .equalsIgnoreCase(goal.getGoalTag()))
                      .count();
              return FamilyWeeklyGoalResponse.from(goal, (int) count);
            })
        .toList();
  }

  @Transactional
  public FamilyWeeklyGoalResponse createGoal(UUID userId, FamilyWeeklyGoalRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = null;
    if (request.familyId() != null) {
      FamilyMember member = ensureFamilyMember(request.familyId(), userId);
      if (member.getRole() == FamilyRole.VIEWER) {
        throw new ForbiddenException("Viewers cannot create goals");
      }
      family =
          familyRepository
              .findById(request.familyId())
              .orElseThrow(() -> new NotFoundException("Family not found"));
    }

    int target = request.targetCount() != null ? request.targetCount() : 1;
    FamilyWeeklyGoal goal =
        new FamilyWeeklyGoal(
            family, user, request.title().trim(), request.goalTag().trim(), target, request.unit());

    return FamilyWeeklyGoalResponse.from(goalRepository.save(goal), 0);
  }

  @Transactional
  public void deleteGoal(UUID userId, UUID goalId) {
    FamilyWeeklyGoal goal =
        goalRepository.findById(goalId).orElseThrow(() -> new NotFoundException("Goal not found"));

    if (goal.getFamily() != null) {
      FamilyMember member = ensureFamilyMember(goal.getFamily().getId(), userId);
      if (member.getRole() == FamilyRole.VIEWER) {
        throw new ForbiddenException("Viewers cannot delete goals");
      }
    } else {
      if (goal.getUser() != null && !goal.getUser().getId().equals(userId)) {
        throw new ForbiddenException("You cannot delete this personal goal");
      }
    }

    goalRepository.delete(goal);
  }

  private FamilyMember ensureFamilyMember(UUID familyId, UUID userId) {
    return familyMemberRepository
        .findByFamilyIdAndUserId(familyId, userId)
        .orElseThrow(() -> new ForbiddenException("You are not a member of this family"));
  }
}
