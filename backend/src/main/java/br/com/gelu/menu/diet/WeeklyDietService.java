package br.com.gelu.menu.diet;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.common.realtime.RealtimeEventPublisher;
import br.com.gelu.menu.diet.dto.CopyWeeklyDietRequest;
import br.com.gelu.menu.diet.dto.CreateDietMealRequest;
import br.com.gelu.menu.diet.dto.DietMealResponse;
import br.com.gelu.menu.diet.dto.UpdateDietMealRequest;
import br.com.gelu.menu.diet.dto.WeeklyDietResponse;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMemberRepository;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.recipes.Recipe;
import br.com.gelu.menu.recipes.RecipeRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeeklyDietService {

  private final WeeklyDietRepository dietRepository;
  private final DietMealRepository mealRepository;
  private final DietMealRecipeRepository mealRecipeRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final RecipeRepository recipeRepository;
  private final UserRepository userRepository;
  private final RealtimeEventPublisher eventPublisher;

  public WeeklyDietService(
      WeeklyDietRepository dietRepository,
      DietMealRepository mealRepository,
      DietMealRecipeRepository mealRecipeRepository,
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      RecipeRepository recipeRepository,
      UserRepository userRepository,
      RealtimeEventPublisher eventPublisher) {
    this.dietRepository = dietRepository;
    this.mealRepository = mealRepository;
    this.mealRecipeRepository = mealRecipeRepository;
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.recipeRepository = recipeRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public WeeklyDietResponse getOrCreateWeeklyDiet(
      UUID userId, UUID familyId, LocalDate requestedWeekStart) {
    return getOrCreateWeeklyDiet(userId, familyId, null, requestedWeekStart);
  }

  @Transactional
  public WeeklyDietResponse getOrCreateWeeklyDiet(
      UUID userId, UUID familyId, Boolean personal, LocalDate requestedWeekStart) {
    LocalDate weekStart =
        requestedWeekStart != null
            ? requestedWeekStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
            : LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    LocalDate weekEnd = weekStart.plusDays(6);

    User user =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

    if (Boolean.TRUE.equals(personal) || (familyId == null && Boolean.TRUE.equals(personal))) {
      Optional<WeeklyDiet> existing =
          dietRepository.findByUserIdAndWeekStartAndFamilyIsNull(userId, weekStart);
      if (existing.isPresent()) {
        return WeeklyDietResponse.from(existing.get());
      }
      String title = formatDietTitle(weekStart, weekEnd);
      WeeklyDiet newDiet = new WeeklyDiet(null, user, title, weekStart, weekEnd);
      return WeeklyDietResponse.from(dietRepository.save(newDiet));
    }

    if (familyId != null) {
      ensureFamilyMember(familyId, userId);
      Family family =
          familyRepository
              .findById(familyId)
              .orElseThrow(() -> new NotFoundException("Family not found"));

      Optional<WeeklyDiet> existing = dietRepository.findByFamilyIdAndWeekStart(familyId, weekStart);
      if (existing.isPresent()) {
        return WeeklyDietResponse.from(existing.get());
      }

      String title = formatDietTitle(weekStart, weekEnd);
      WeeklyDiet newDiet = new WeeklyDiet(family, user, title, weekStart, weekEnd);
      return WeeklyDietResponse.from(dietRepository.save(newDiet));
    }

    // Tentar achar família padrão do usuário se não informada
    Optional<Family> defaultFamily =
        familyRepository.findAllByMemberUserId(userId).stream().findFirst();
    if (defaultFamily.isPresent()) {
      Family family = defaultFamily.get();
      Optional<WeeklyDiet> existing =
          dietRepository.findByFamilyIdAndWeekStart(family.getId(), weekStart);
      if (existing.isPresent()) {
        return WeeklyDietResponse.from(existing.get());
      }
      String title = formatDietTitle(weekStart, weekEnd);
      WeeklyDiet newDiet = new WeeklyDiet(family, user, title, weekStart, weekEnd);
      return WeeklyDietResponse.from(dietRepository.save(newDiet));
    }

    // Dieta pessoal
    Optional<WeeklyDiet> existing =
        dietRepository.findByUserIdAndWeekStartAndFamilyIsNull(userId, weekStart);
    if (existing.isPresent()) {
      return WeeklyDietResponse.from(existing.get());
    }
    String title = formatDietTitle(weekStart, weekEnd);
    WeeklyDiet newDiet = new WeeklyDiet(null, user, title, weekStart, weekEnd);
    return WeeklyDietResponse.from(dietRepository.save(newDiet));
  }

  @Transactional
  public DietMealResponse addMeal(UUID userId, UUID dietId, CreateDietMealRequest request) {
    WeeklyDiet diet =
        dietRepository.findById(dietId).orElseThrow(() -> new NotFoundException("Diet not found"));
    ensureAccess(diet, userId);

    LocalTime mealTime = parseTime(request.mealTime());
    int order = request.orderIndex() != null ? request.orderIndex() : 0;

    DietMeal meal =
        new DietMeal(
            diet,
            request.weekDay().toUpperCase(),
            request.mealName().trim(),
            mealTime,
            request.notes(),
            order);

    // Associação de Receita
    if (request.recipeId() != null) {
      Recipe recipe =
          recipeRepository
              .findById(request.recipeId())
              .orElseThrow(() -> new NotFoundException("Recipe not found"));
      BigDecimal servings =
          request.servings() != null && request.servings().compareTo(BigDecimal.ZERO) > 0
              ? request.servings()
              : BigDecimal.ONE;
      DietMealRecipe mealRecipe = new DietMealRecipe(meal, recipe, servings);
      meal.getRecipes().add(mealRecipe);
    }

    // Associação de Pessoas (membros da família ou usuário único no modo pessoal)
    Set<User> people;
    if (diet.getFamily() == null) {
      people = Set.of(userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found")));
    } else {
      people = resolvePeople(request.personUserIds(), userId);
    }
    meal.setPeople(people);

    diet.addMeal(meal);
    DietMeal saved = mealRepository.save(meal);
    DietMealResponse response = DietMealResponse.from(saved);
    if (diet.getFamily() != null) {
      eventPublisher.publishFamilyEvent(diet.getFamily().getId(), "DIET_MEAL_CREATED", response);
    }
    return response;
  }

  @Transactional
  public DietMealResponse updateMeal(UUID userId, UUID mealId, UpdateDietMealRequest request) {
    DietMeal meal =
        mealRepository.findById(mealId).orElseThrow(() -> new NotFoundException("Meal not found"));
    ensureAccess(meal.getDiet(), userId);

    meal.setWeekDay(request.weekDay().toUpperCase());
    meal.setMealName(request.mealName().trim());
    meal.setMealTime(parseTime(request.mealTime()));
    meal.setNotes(request.notes());
    if (request.orderIndex() != null) {
      meal.setOrderIndex(request.orderIndex());
    }

    // Atualizar receita associada
    if (request.recipeId() == null) {
      meal.getRecipes().clear();
    } else {
      Recipe recipe =
          recipeRepository
              .findById(request.recipeId())
              .orElseThrow(() -> new NotFoundException("Recipe not found"));
      BigDecimal servings =
          request.servings() != null && request.servings().compareTo(BigDecimal.ZERO) > 0
              ? request.servings()
              : BigDecimal.ONE;

      java.util.Optional<DietMealRecipe> existingRecipe =
          meal.getRecipes().stream()
              .filter(r -> r.getRecipe().getId().equals(request.recipeId()))
              .findFirst();

      if (existingRecipe.isPresent()) {
        existingRecipe.get().setServings(servings);
        meal.getRecipes().removeIf(r -> !r.getRecipe().getId().equals(request.recipeId()));
      } else {
        meal.getRecipes().clear();
        mealRepository.saveAndFlush(meal);
        DietMealRecipe mealRecipe = new DietMealRecipe(meal, recipe, servings);
        meal.getRecipes().add(mealRecipe);
      }
    }

    // Atualizar pessoas
    Set<User> people;
    if (meal.getDiet().getFamily() == null) {
      people = Set.of(userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found")));
    } else {
      people = resolvePeople(request.personUserIds(), userId);
    }
    meal.setPeople(people);

    DietMeal updated = mealRepository.save(meal);
    DietMealResponse response = DietMealResponse.from(updated);
    if (meal.getDiet().getFamily() != null) {
      eventPublisher.publishFamilyEvent(meal.getDiet().getFamily().getId(), "DIET_MEAL_UPDATED", response);
    }
    return response;
  }

  @Transactional
  public void deleteMeal(UUID userId, UUID mealId) {
    DietMeal meal =
        mealRepository.findById(mealId).orElseThrow(() -> new NotFoundException("Meal not found"));
    ensureAccess(meal.getDiet(), userId);

    UUID familyId = meal.getDiet().getFamily() != null ? meal.getDiet().getFamily().getId() : null;
    meal.getDiet().removeMeal(meal);
    mealRepository.delete(meal);
    if (familyId != null) {
      eventPublisher.publishFamilyEvent(familyId, "DIET_MEAL_DELETED", java.util.Map.of("id", mealId.toString()));
    }
  }

  @Transactional
  public WeeklyDietResponse copyWeeklyDiet(
      UUID userId, UUID sourceDietId, CopyWeeklyDietRequest request) {
    WeeklyDiet sourceDiet =
        dietRepository
            .findById(sourceDietId)
            .orElseThrow(() -> new NotFoundException("Source diet not found"));
    ensureAccess(sourceDiet, userId);

    LocalDate targetStart =
        request.targetWeekStart().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    LocalDate targetEnd = targetStart.plusDays(6);

    if (targetStart.equals(sourceDiet.getWeekStart())) {
      throw new BadRequestException("Target week cannot be the same as the source week");
    }

    User user =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

    WeeklyDiet targetDiet;
    if (sourceDiet.getFamily() != null) {
      Optional<WeeklyDiet> existing =
          dietRepository.findByFamilyIdAndWeekStart(sourceDiet.getFamily().getId(), targetStart);
      targetDiet =
          existing.orElseGet(
              () ->
                  dietRepository.save(
                      new WeeklyDiet(
                          sourceDiet.getFamily(),
                          user,
                          formatDietTitle(targetStart, targetEnd),
                          targetStart,
                          targetEnd)));
    } else {
      Optional<WeeklyDiet> existing =
          dietRepository.findByUserIdAndWeekStartAndFamilyIsNull(userId, targetStart);
      targetDiet =
          existing.orElseGet(
              () ->
                  dietRepository.save(
                      new WeeklyDiet(
                          null,
                          user,
                          formatDietTitle(targetStart, targetEnd),
                          targetStart,
                          targetEnd)));
    }

    // Clonar refeições
    for (DietMeal srcMeal : sourceDiet.getMeals()) {
      DietMeal clone =
          new DietMeal(
              targetDiet,
              srcMeal.getWeekDay(),
              srcMeal.getMealName(),
              srcMeal.getMealTime(),
              srcMeal.getNotes(),
              srcMeal.getOrderIndex());

      for (DietMealRecipe r : srcMeal.getRecipes()) {
        clone.getRecipes().add(new DietMealRecipe(clone, r.getRecipe(), r.getServings()));
      }
      clone.setPeople(new HashSet<>(srcMeal.getPeople()));
      targetDiet.addMeal(clone);
      mealRepository.save(clone);
    }

    return WeeklyDietResponse.from(dietRepository.save(targetDiet));
  }

  private Set<User> resolvePeople(List<UUID> personUserIds, UUID defaultUserId) {
    Set<User> result = new HashSet<>();
    if (personUserIds != null && !personUserIds.isEmpty()) {
      for (UUID pid : personUserIds) {
        userRepository.findById(pid).ifPresent(result::add);
      }
    }
    // Fallback: se nenhuma pessoa foi informada, atribui à própria pessoa
    if (result.isEmpty()) {
      userRepository.findById(defaultUserId).ifPresent(result::add);
    }
    return result;
  }

  private LocalTime parseTime(String t) {
    if (t == null || t.isBlank()) return null;
    try {
      if (t.length() == 5) return LocalTime.parse(t + ":00");
      return LocalTime.parse(t);
    } catch (Exception e) {
      return null;
    }
  }

  private String formatDietTitle(LocalDate start, LocalDate end) {
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
    return "Cardápio Semanal (" + start.format(fmt) + " a " + end.format(fmt) + ")";
  }

  private void ensureAccess(WeeklyDiet diet, UUID userId) {
    if (diet.getFamily() != null) {
      ensureFamilyMember(diet.getFamily().getId(), userId);
    } else if (!diet.getUser().getId().equals(userId)) {
      throw new ForbiddenException("You do not have access to this diet");
    }
  }

  private void ensureFamilyMember(UUID familyId, UUID userId) {
    if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
      throw new ForbiddenException("You are not a member of this family");
    }
  }
}
