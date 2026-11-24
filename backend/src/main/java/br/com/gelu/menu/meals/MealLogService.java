package br.com.gelu.menu.meals;

import br.com.gelu.menu.admin.AiUsageLog;
import br.com.gelu.menu.admin.AiUsageLogRepository;
import br.com.gelu.menu.admin.SystemSetting;
import br.com.gelu.menu.admin.SystemSettingRepository;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.diet.DietMeal;
import br.com.gelu.menu.diet.DietMealRecipe;
import br.com.gelu.menu.diet.DietMealRepository;
import br.com.gelu.menu.diet.WeeklyDiet;
import br.com.gelu.menu.diet.WeeklyDietRepository;
import br.com.gelu.menu.diet.dto.DietMealResponse;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.meals.dto.AnalyzeMealPhotoResponse;
import br.com.gelu.menu.meals.dto.CreateMealLogRequest;
import br.com.gelu.menu.meals.dto.DailyMealChecklistItemResponse;
import br.com.gelu.menu.meals.dto.DailyMealSummaryResponse;
import br.com.gelu.menu.meals.dto.HabitInsightsResponse;
import br.com.gelu.menu.meals.dto.MealLogResponse;
import br.com.gelu.menu.meals.dto.ParseMealTextRequest;
import br.com.gelu.menu.meals.dto.ParseMealTextResponse;
import br.com.gelu.menu.meals.dto.QuickCheckinMealRequest;
import br.com.gelu.menu.media.ObjectStorageService;
import br.com.gelu.menu.users.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MealLogService {

  private static final Set<String> ALLOWED_IMAGE_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp");
  private static final long MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

  private final MealLogRepository mealLogRepository;
  private final ObjectStorageService objectStorageService;
  private final SystemSettingRepository systemSettingRepository;
  private final AiUsageLogRepository aiUsageLogRepository;
  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final DietMealRepository dietMealRepository;
  private final WeeklyDietRepository weeklyDietRepository;
  private final ObjectMapper objectMapper;
  private final String superAdminEmail;

  public MealLogService(
      MealLogRepository mealLogRepository,
      ObjectStorageService objectStorageService,
      SystemSettingRepository systemSettingRepository,
      AiUsageLogRepository aiUsageLogRepository,
      UserRepository userRepository,
      FamilyRepository familyRepository,
      DietMealRepository dietMealRepository,
      WeeklyDietRepository weeklyDietRepository,
      ObjectMapper objectMapper,
      @Value("${gelu.super-admin-email:luanvitors_852@hotmail.com}") String superAdminEmail) {
    this.mealLogRepository = mealLogRepository;
    this.objectStorageService = objectStorageService;
    this.systemSettingRepository = systemSettingRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.dietMealRepository = dietMealRepository;
    this.weeklyDietRepository = weeklyDietRepository;
    this.objectMapper = objectMapper;
    this.superAdminEmail = superAdminEmail;
  }

  // =========================================================================
  // 1. FoodVisionAgent: Análise Fotográfica Multimodal
  // =========================================================================

  public AnalyzeMealPhotoResponse analyzeMealPhoto(
      UUID userId, MultipartFile file, String mealTypeHint, String notesHint) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Foto da refeição é obrigatória");
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
      throw new BadRequestException(
          "Formato de imagem inválido. Formatos suportados: JPG, PNG, WEBP");
    }

    if (file.getSize() > MAX_PHOTO_SIZE) {
      throw new BadRequestException("A foto não pode ultrapassar 10 MB");
    }

    // 1. Upload seguro da foto no MinIO
    String ext = "jpg";
    if (contentType.contains("png")) ext = "png";
    else if (contentType.contains("webp")) ext = "webp";

    String objectKey = "meal-photos/" + UUID.randomUUID() + "." + ext;
    try (InputStream is = file.getInputStream()) {
      objectStorageService.put(objectKey, is, file.getSize(), contentType);
    } catch (Exception e) {
      throw new BadRequestException("Erro ao armazenar imagem da refeição");
    }

    String photoUrl = "/api/v1/meals/photo/" + objectKey.replace("meal-photos/", "");

    // 2. Análise Multimodal com FoodVisionAgent (Gemini 2.5 Flash ou Fallback Local)
    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    long startMs = System.currentTimeMillis();
    AnalyzeMealPhotoResponse analysis = null;
    int promptTokens = 0;
    int completionTokens = 0;
    int totalTokens = 0;
    String status = "SUCCESS_LOCAL";

    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        byte[] imageBytes = file.getBytes();
        GeminiVisionResult result =
            callGeminiVisionApi(
                apiKey.trim(), model, imageBytes, contentType, mealTypeHint, notesHint, photoUrl);
        if (result != null && result.response != null) {
          analysis = result.response;
          promptTokens = result.promptTokens;
          completionTokens = result.completionTokens;
          totalTokens = result.totalTokens;
          status = "SUCCESS_GEMINI";
        }
      } catch (Exception e) {
        status = "FALLBACK_LOCAL";
      }
    }

    if (analysis == null) {
      analysis = fallbackLocalFoodVision(mealTypeHint, notesHint, photoUrl);
      promptTokens = 150;
      completionTokens = 250;
      totalTokens = 400;
    }

    long latency = System.currentTimeMillis() - startMs;

    // 3. Telemetria e auditoria de IA
    try {
      UUID familyId = null;
      if (userId != null) {
        List<Family> families = familyRepository.findAllByMemberUserId(userId);
        if (!families.isEmpty()) familyId = families.get(0).getId();
      }
      AiUsageLog log =
          new AiUsageLog(
              userId,
              familyId,
              "FOOD_VISION_ANALYZE",
              status.contains("GEMINI") ? model : "local-food-heuristic",
              promptTokens,
              completionTokens,
              totalTokens,
              latency,
              status);
      aiUsageLogRepository.save(log);
    } catch (Exception ignored) {
    }

    return analysis;
  }

  // =========================================================================
  // 2. FoodParserAgent: Decomposição de Texto Livre em Linguagem Natural
  // =========================================================================

  public ParseMealTextResponse parseMealText(UUID userId, ParseMealTextRequest request) {
    if (request == null || request.text() == null || request.text().isBlank()) {
      throw new BadRequestException("Texto da refeição é obrigatório");
    }

    String apiKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    String model =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-2.5-flash");

    long startMs = System.currentTimeMillis();
    ParseMealTextResponse analysis = null;
    int promptTokens = 0;
    int completionTokens = 0;
    int totalTokens = 0;
    String status = "SUCCESS_LOCAL";

    if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("...")) {
      try {
        GeminiTextResult result =
            callGeminiFoodParserApi(apiKey.trim(), model, request.text(), request.mealType());
        if (result != null && result.response != null) {
          analysis = result.response;
          promptTokens = result.promptTokens;
          completionTokens = result.completionTokens;
          totalTokens = result.totalTokens;
          status = "SUCCESS_GEMINI";
        }
      } catch (Exception e) {
        status = "FALLBACK_LOCAL";
      }
    }

    if (analysis == null) {
      analysis = fallbackLocalFoodTextParser(request.text(), request.mealType());
      promptTokens = 120;
      completionTokens = 200;
      totalTokens = 320;
    }

    long latency = System.currentTimeMillis() - startMs;

    try {
      UUID familyId = null;
      if (userId != null) {
        List<Family> families = familyRepository.findAllByMemberUserId(userId);
        if (!families.isEmpty()) familyId = families.get(0).getId();
      }
      AiUsageLog log =
          new AiUsageLog(
              userId,
              familyId,
              "FOOD_PARSER_TEXT",
              status.contains("GEMINI") ? model : "local-text-heuristic",
              promptTokens,
              completionTokens,
              totalTokens,
              latency,
              status);
      aiUsageLogRepository.save(log);
    } catch (Exception ignored) {
    }

    return analysis;
  }

  // =========================================================================
  // 3. Quick Check-in em 1 Toque (Planejado vs Pulado)
  // =========================================================================

  @Transactional
  public MealLogResponse quickCheckin(UUID userId, QuickCheckinMealRequest request) {
    if (userId == null) {
      throw new BadRequestException("Usuário não autenticado");
    }
    if (request.dietMealId() == null) {
      throw new BadRequestException("ID da refeição planejada é obrigatório");
    }

    DietMeal dietMeal =
        dietMealRepository
            .findById(request.dietMealId())
            .orElseThrow(() -> new NotFoundException("Refeição planejada não encontrada"));

    LocalDate targetDate = request.date() != null ? request.date() : LocalDate.now();
    LocalDateTime start = targetDate.atStartOfDay();
    LocalDateTime end = targetDate.plusDays(1).atStartOfDay().minusNanos(1);

    // Se já existia um registro prévio desta mesma refeição hoje, removemos para atualizar
    List<MealLog> existingLogs =
        mealLogRepository.findAllByUserIdAndDietMealIdInAndConsumedAtBetween(
            userId, List.of(dietMeal.getId()), start, end);
    if (!existingLogs.isEmpty()) {
      mealLogRepository.deleteAll(existingLogs);
    }

    UUID familyId = null;
    List<Family> families = familyRepository.findAllByMemberUserId(userId);
    if (!families.isEmpty()) {
      familyId = families.get(0).getId();
    }

    LocalTime mealTime = dietMeal.getMealTime() != null ? dietMeal.getMealTime() : LocalTime.now();
    LocalDateTime consumedAt = targetDate.atTime(mealTime);

    String status =
        request.status() != null ? request.status().toUpperCase() : "PLANNED_CONSUMED";

    if ("SKIPPED".equals(status)) {
      String skipReason =
          request.skipReason() != null && !request.skipReason().isBlank()
              ? request.skipReason()
              : "Refeição pulada / jejum";

      MealLog log =
          new MealLog(
              userId,
              familyId,
              dietMeal.getId(),
              dietMeal.getMealName(),
              dietMeal.getMealName() + " (Pulada)",
              null,
              BigDecimal.ZERO,
              BigDecimal.ZERO,
              BigDecimal.ZERO,
              BigDecimal.ZERO,
              BigDecimal.ZERO,
              BigDecimal.ZERO,
              "[]",
              "Refeição marcada como pulada / jejum pelo usuário.",
              "SKIPPED",
              "ONE_CLICK_PLANNED",
              null,
              skipReason,
              consumedAt);
      MealLog saved = mealLogRepository.save(log);
      return toResponse(saved);
    }

    // Status: PLANNED_CONSUMED (1 clique conforme cardápio)
    DietMealResponse dietResp = DietMealResponse.from(dietMeal);
    BigDecimal totalCalories =
        dietResp.totalEstimatedCalories() != null && dietResp.totalEstimatedCalories().compareTo(BigDecimal.ZERO) > 0
            ? dietResp.totalEstimatedCalories()
            : BigDecimal.valueOf(350.0);

    // Divisão equilibrada de macronutrientes padrão (25% Proteínas, 50% Carbos, 25% Gorduras)
    BigDecimal proteins =
        totalCalories
            .multiply(BigDecimal.valueOf(0.25))
            .divide(BigDecimal.valueOf(4), 1, RoundingMode.HALF_UP);
    BigDecimal carbs =
        totalCalories
            .multiply(BigDecimal.valueOf(0.50))
            .divide(BigDecimal.valueOf(4), 1, RoundingMode.HALF_UP);
    BigDecimal fats =
        totalCalories
            .multiply(BigDecimal.valueOf(0.25))
            .divide(BigDecimal.valueOf(9), 1, RoundingMode.HALF_UP);
    BigDecimal fibers = BigDecimal.valueOf(5.0);
    BigDecimal sodium = BigDecimal.valueOf(350.0);

    List<FoodItemIdentified> items = new ArrayList<>();
    if (dietMeal.getRecipes() != null && !dietMeal.getRecipes().isEmpty()) {
      for (DietMealRecipe r : dietMeal.getRecipes()) {
        BigDecimal recipeCals =
            r.getRecipe().getEstimatedCalories() != null
                ? r.getRecipe().getEstimatedCalories().multiply(r.getServings())
                : BigDecimal.valueOf(150.0);
        items.add(
            new FoodItemIdentified(
                r.getRecipe().getName(),
                r.getServings() + " porção(ões)",
                recipeCals.setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(15.0),
                BigDecimal.valueOf(20.0),
                BigDecimal.valueOf(5.0)));
      }
    } else {
      items.add(
          new FoodItemIdentified(
              dietMeal.getMealName(), "1 porção", totalCalories, proteins, carbs, fats));
    }

    String itemsJson = null;
    try {
      itemsJson = objectMapper.writeValueAsString(items);
    } catch (Exception ignored) {
    }

    String dishName =
        !items.isEmpty()
            ? items.stream().map(FoodItemIdentified::name).collect(Collectors.joining(" + "))
            : dietMeal.getMealName();

    MealLog log =
        new MealLog(
            userId,
            familyId,
            dietMeal.getId(),
            dietMeal.getMealName(),
            dishName,
            null,
            totalCalories,
            proteins,
            carbs,
            fats,
            fibers,
            sodium,
            itemsJson,
            "Refeição confirmada em 1 clique conforme o cardápio planejado.",
            "PLANNED_CONSUMED",
            "ONE_CLICK_PLANNED",
            null,
            null,
            consumedAt);

    MealLog saved = mealLogRepository.save(log);
    return toResponse(saved);
  }

  // =========================================================================
  // 4. Checklist Diário de Refeições (Planejado vs Realizado)
  // =========================================================================

  @Transactional(readOnly = true)
  public List<DailyMealChecklistItemResponse> getDailyChecklist(
      UUID userId, UUID familyId, LocalDate date) {
    LocalDate targetDate = date != null ? date : LocalDate.now();
    String weekDay = getWeekDayKey(targetDate);
    LocalDate monday = targetDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

    Optional<WeeklyDiet> dietOpt = Optional.empty();
    if (familyId != null) {
      dietOpt = weeklyDietRepository.findByFamilyIdAndWeekStart(familyId, monday);
    }
    if (dietOpt.isEmpty()) {
      dietOpt = weeklyDietRepository.findByUserIdAndWeekStartAndFamilyIsNull(userId, monday);
    }

    // Se não encontrou a semana exata, busca a dieta mais recente
    if (dietOpt.isEmpty()) {
      if (familyId != null) {
        List<WeeklyDiet> list = weeklyDietRepository.findAllByFamilyIdOrderByWeekStartDesc(familyId);
        if (!list.isEmpty()) dietOpt = Optional.of(list.get(0));
      } else {
        List<WeeklyDiet> list =
            weeklyDietRepository.findAllByUserIdAndFamilyIsNullOrderByWeekStartDesc(userId);
        if (!list.isEmpty()) dietOpt = Optional.of(list.get(0));
      }
    }

    if (dietOpt.isEmpty()) {
      return List.of();
    }

    WeeklyDiet diet = dietOpt.get();
    List<DietMeal> plannedMeals =
        dietMealRepository.findByDietIdAndWeekDayOrderByOrderIndexAscMealTimeAsc(
            diet.getId(), weekDay);

    LocalDateTime start = targetDate.atStartOfDay();
    LocalDateTime end = targetDate.plusDays(1).atStartOfDay().minusNanos(1);
    List<MealLog> dayLogs =
        mealLogRepository.findAllByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(
            userId, start, end);

    List<DailyMealChecklistItemResponse> checklist = new ArrayList<>();

    for (DietMeal meal : plannedMeals) {
      MealLog matchingLog =
          dayLogs.stream()
              .filter(
                  l ->
                      (l.getDietMealId() != null && l.getDietMealId().equals(meal.getId()))
                          || (l.getMealType() != null
                              && l.getMealType().equalsIgnoreCase(meal.getMealName())))
              .findFirst()
              .orElse(null);

      DietMealResponse resp = DietMealResponse.from(meal);
      List<String> recipes =
          resp.recipes() != null
              ? resp.recipes().stream().map(r -> r.recipeName()).toList()
              : List.of();
      Double plannedCals =
          resp.totalEstimatedCalories() != null ? resp.totalEstimatedCalories().doubleValue() : 0.0;

      if (matchingLog != null) {
        checklist.add(
            new DailyMealChecklistItemResponse(
                meal.getId(),
                meal.getMealName(),
                meal.getMealTime(),
                meal.getWeekDay(),
                meal.getOrderIndex(),
                plannedCals,
                recipes,
                matchingLog.getStatus(),
                matchingLog.getId(),
                matchingLog.getDishName(),
                matchingLog.getPhotoUrl(),
                matchingLog.getTotalCalories().doubleValue(),
                matchingLog.getProteins().doubleValue(),
                matchingLog.getCarbohydrates().doubleValue(),
                matchingLog.getFats().doubleValue(),
                matchingLog.getSkipReason()));
      } else {
        checklist.add(
            new DailyMealChecklistItemResponse(
                meal.getId(),
                meal.getMealName(),
                meal.getMealTime(),
                meal.getWeekDay(),
                meal.getOrderIndex(),
                plannedCals,
                recipes,
                "PENDING",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null));
      }
    }

    return checklist;
  }

  // =========================================================================
  // 5. Motor de Hábitos Alimentares & Insights da IA
  // =========================================================================

  @Transactional(readOnly = true)
  public HabitInsightsResponse getHabitsInsights(UUID userId, UUID familyId) {
    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
    List<MealLog> recentLogs =
        mealLogRepository.findAllByUserIdAndConsumedAtAfterOrderByConsumedAtDesc(
            userId, thirtyDaysAgo);

    int plannedConsumedCount =
        (int) recentLogs.stream().filter(l -> "PLANNED_CONSUMED".equals(l.getStatus())).count();
    int customConsumedCount =
        (int) recentLogs.stream().filter(l -> "CUSTOM_CONSUMED".equals(l.getStatus())).count();
    int skippedCount =
        (int) recentLogs.stream().filter(l -> "SKIPPED".equals(l.getStatus())).count();

    int totalPlannedOpportunities = plannedConsumedCount + customConsumedCount + skippedCount;
    double adherenceRate =
        totalPlannedOpportunities > 0
            ? Math.round(((double) plannedConsumedCount / totalPlannedOpportunities) * 100.0)
            : 100.0;

    // Pratos habituais mais frequentes
    Map<String, List<MealLog>> byDish =
        recentLogs.stream()
            .filter(l -> !"SKIPPED".equals(l.getStatus()) && l.getDishName() != null)
            .collect(Collectors.groupingBy(l -> l.getDishName().trim()));

    List<HabitInsightsResponse.StapleMealHabit> staples =
        byDish.entrySet().stream()
            .filter(e -> e.getValue().size() >= 2)
            .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
            .limit(4)
            .map(
                e -> {
                  List<MealLog> logs = e.getValue();
                  double avgCal =
                      logs.stream()
                          .mapToDouble(l -> l.getTotalCalories().doubleValue())
                          .average()
                          .orElse(0.0);
                  double avgProt =
                      logs.stream()
                          .mapToDouble(l -> l.getProteins().doubleValue())
                          .average()
                          .orElse(0.0);
                  return new HabitInsightsResponse.StapleMealHabit(
                      e.getKey(),
                      logs.get(0).getMealType(),
                      logs.size(),
                      Math.round(avgCal * 10.0) / 10.0,
                      Math.round(avgProt * 10.0) / 10.0);
                })
            .toList();

    // Dica de coaching nutricional inteligente da IA
    String tip;
    if (adherenceRate >= 80.0) {
      tip =
          "Fantástica consistência! Você seguiu o cardápio em "
              + (int) adherenceRate
              + "% das refeições nos últimos 30 dias. Manter a rotina alinhada ao plano acelera o alcance de metas calóricas.";
    } else if (skippedCount >= 3) {
      tip =
          "Notamos "
              + skippedCount
              + " refeições puladas nos últimos dias. Pular refeições pode diminuir o metabolismo basal; manter lanches rápidos e proteicos ajuda na saciedade.";
    } else if (!staples.isEmpty()) {
      tip =
          "Você costuma repetir '"
              + staples.get(0).dishName()
              + "' com frequência ("
              + staples.get(0).timesLogged()
              + "x). Pratos habituais mantêm a praticidade no dia a dia!";
    } else {
      tip =
          "O motor de hábitos da IA está aprendendo seu padrão de refeições. Use os botões de 1 clique ou digite o que comeu para gerar análises cada vez mais precisas.";
    }

    return new HabitInsightsResponse(
        adherenceRate,
        totalPlannedOpportunities,
        plannedConsumedCount,
        customConsumedCount,
        skippedCount,
        staples,
        tip);
  }

  // =========================================================================
  // 6. Métodos CRUD Básicos de MealLog
  // =========================================================================

  @Transactional
  public MealLogResponse saveMealLog(UUID userId, CreateMealLogRequest request) {
    if (userId == null) {
      throw new BadRequestException("Usuário não autenticado");
    }

    if (request.dishName() == null || request.dishName().isBlank()) {
      throw new BadRequestException("Nome do prato ou refeição é obrigatório");
    }

    UUID familyId = null;
    List<Family> families = familyRepository.findAllByMemberUserId(userId);
    if (!families.isEmpty()) {
      familyId = families.get(0).getId();
    }

    String itemsJson = null;
    if (request.items() != null && !request.items().isEmpty()) {
      try {
        itemsJson = objectMapper.writeValueAsString(request.items());
      } catch (Exception ignored) {
      }
    }

    LocalDateTime consumedAt =
        request.consumedAt() != null ? request.consumedAt() : LocalDateTime.now();

    MealLog log =
        new MealLog(
            userId,
            familyId,
            request.dietMealId(),
            request.mealType() != null ? request.mealType() : "OTHER",
            request.dishName().trim(),
            request.photoUrl(),
            request.totalCalories(),
            request.proteins(),
            request.carbohydrates(),
            request.fats(),
            request.fibers(),
            request.sodium(),
            itemsJson,
            request.aiNotes(),
            request.status() != null ? request.status() : "CUSTOM_CONSUMED",
            request.inputMethod() != null ? request.inputMethod() : "MANUAL",
            request.rawInputText(),
            request.skipReason(),
            consumedAt);

    MealLog saved = mealLogRepository.save(log);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<MealLogResponse> listMealLogs(UUID userId, LocalDate date) {
    LocalDate targetDate = date != null ? date : LocalDate.now();
    LocalDateTime start = targetDate.atStartOfDay();
    LocalDateTime end = targetDate.plusDays(1).atStartOfDay().minusNanos(1);

    return mealLogRepository
        .findAllByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(userId, start, end)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public DailyMealSummaryResponse getDailySummary(UUID userId, LocalDate date) {
    List<MealLogResponse> meals = listMealLogs(userId, date);

    BigDecimal totalCalories = BigDecimal.ZERO;
    BigDecimal totalProteins = BigDecimal.ZERO;
    BigDecimal totalCarbohydrates = BigDecimal.ZERO;
    BigDecimal totalFats = BigDecimal.ZERO;
    BigDecimal totalFibers = BigDecimal.ZERO;
    BigDecimal totalSodium = BigDecimal.ZERO;

    for (MealLogResponse m : meals) {
      if (!"SKIPPED".equalsIgnoreCase(m.status())) {
        totalCalories = totalCalories.add(m.totalCalories());
        totalProteins = totalProteins.add(m.proteins());
        totalCarbohydrates = totalCarbohydrates.add(m.carbohydrates());
        totalFats = totalFats.add(m.fats());
        if (m.fibers() != null) totalFibers = totalFibers.add(m.fibers());
        if (m.sodium() != null) totalSodium = totalSodium.add(m.sodium());
      }
    }

    return new DailyMealSummaryResponse(
        date != null ? date : LocalDate.now(),
        totalCalories.setScale(1, RoundingMode.HALF_UP),
        totalProteins.setScale(1, RoundingMode.HALF_UP),
        totalCarbohydrates.setScale(1, RoundingMode.HALF_UP),
        totalFats.setScale(1, RoundingMode.HALF_UP),
        totalFibers.setScale(1, RoundingMode.HALF_UP),
        totalSodium.setScale(1, RoundingMode.HALF_UP),
        meals.size(),
        meals);
  }

  @Transactional
  public void deleteMealLog(UUID userId, UUID mealLogId) {
    MealLog meal =
        mealLogRepository
            .findById(mealLogId)
            .orElseThrow(() -> new NotFoundException("Registro de refeição não encontrado"));

    if (!meal.getUserId().equals(userId)) {
      throw new BadRequestException("Você não tem permissão para excluir esta refeição");
    }

    mealLogRepository.delete(meal);
  }

  // =========================================================================
  // 7. Chamadas HTTP para o Gemini API & Fallbacks
  // =========================================================================

  private GeminiVisionResult callGeminiVisionApi(
      String apiKey,
      String model,
      byte[] imageBytes,
      String mimeType,
      String mealTypeHint,
      String notesHint,
      String photoUrl)
      throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    String base64Image = Base64.getEncoder().encodeToString(imageBytes);
    String hintMeal = mealTypeHint != null && !mealTypeHint.isBlank() ? mealTypeHint : "Refeição";
    String hintNotes =
        notesHint != null && !notesHint.isBlank()
            ? notesHint
            : "Nenhuma informação adicional fornecida.";

    String systemInstruction =
        "Você é o FoodVisionAgent especialista em nutrição clínica, gastronomia brasileira e análise visual de alimentos do GeLu Menu. "
            + "Analise a foto do prato fornecida, identifique cada alimento visível, estime as porções com precisão e calcule os macronutrientes totais. "
            + "Responda ESTRITAMENTE em formato JSON com o seguinte schema:\n"
            + "{\n"
            + "  \"dishName\": \"Nome principal do prato/refeição\",\n"
            + "  \"confidence\": \"HIGH\",\n"
            + "  \"totalCalories\": 450.0,\n"
            + "  \"proteins\": 35.0,\n"
            + "  \"carbohydrates\": 45.0,\n"
            + "  \"fats\": 12.0,\n"
            + "  \"fibers\": 6.0,\n"
            + "  \"sodium\": 380.0,\n"
            + "  \"items\": [\n"
            + "    {\n"
            + "      \"name\": \"Alimento identificado\",\n"
            + "      \"portion\": \"150g (1 filé médio)\",\n"
            + "      \"calories\": 240.0,\n"
            + "      \"proteins\": 30.0,\n"
            + "      \"carbohydrates\": 0.0,\n"
            + "      \"fats\": 4.5\n"
            + "    }\n"
            + "  ],\n"
            + "  \"nutritionNotes\": \"Breve diagnóstico ou dica nutricional sobre o prato\"\n"
            + "}";

    String userPrompt =
        "Analise esta foto de refeição ("
            + hintMeal
            + "). Notas do usuário: "
            + hintNotes
            + ". Extraia nome do prato, calorias totais estimadas, proteínas (g), carboidratos (g), gorduras (g), fibras (g), sódio (mg) e os itens componentes.";

    String requestBody =
        "{"
            + "\"system_instruction\":{\"parts\":[{\"text\":\""
            + escapeJson(systemInstruction)
            + "\"}]},"
            + "\"contents\":[{\"role\":\"user\",\"parts\":["
            + "{\"text\":\""
            + escapeJson(userPrompt)
            + "\"},"
            + "{\"inline_data\":{\"mime_type\":\""
            + mimeType
            + "\",\"data\":\""
            + base64Image
            + "\"}}"
            + "]}],"
            + "\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.2}"
            + "}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new RuntimeException("Gemini Vision API error: " + response.statusCode());
    }

    JsonNode root = objectMapper.readTree(response.body());
    JsonNode textNode =
        root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
    if (textNode.isMissingNode()) {
      throw new RuntimeException("No text in Gemini Vision response");
    }

    JsonNode parsed = objectMapper.readTree(textNode.asText().trim());

    String dishName = parsed.path("dishName").asText("Refeição Identificada");
    String confidence = parsed.path("confidence").asText("HIGH");
    BigDecimal totalCalories =
        BigDecimal.valueOf(parsed.path("totalCalories").asDouble(450.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal proteins =
        BigDecimal.valueOf(parsed.path("proteins").asDouble(30.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal carbohydrates =
        BigDecimal.valueOf(parsed.path("carbohydrates").asDouble(45.0))
            .setScale(1, RoundingMode.HALF_UP);
    BigDecimal fats =
        BigDecimal.valueOf(parsed.path("fats").asDouble(12.0)).setScale(1, RoundingMode.HALF_UP);
    BigDecimal fibers =
        BigDecimal.valueOf(parsed.path("fibers").asDouble(5.0)).setScale(1, RoundingMode.HALF_UP);
    BigDecimal sodium =
        BigDecimal.valueOf(parsed.path("sodium").asDouble(350.0)).setScale(1, RoundingMode.HALF_UP);
    String nutritionNotes =
        parsed
            .path("nutritionNotes")
            .asText("Refeição balanceada identificada por inteligência artificial.");

    List<FoodItemIdentified> items = new ArrayList<>();
    JsonNode itemsNode = parsed.path("items");
    if (itemsNode.isArray()) {
      for (JsonNode item : itemsNode) {
        items.add(
            new FoodItemIdentified(
                item.path("name").asText("Alimento"),
                item.path("portion").asText("1 porção"),
                BigDecimal.valueOf(item.path("calories").asDouble(100.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("proteins").asDouble(5.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("carbohydrates").asDouble(10.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("fats").asDouble(2.0))
                    .setScale(1, RoundingMode.HALF_UP)));
      }
    }

    if (items.isEmpty()) {
      items.add(
          new FoodItemIdentified(
              dishName, "1 prato", totalCalories, proteins, carbohydrates, fats));
    }

    AnalyzeMealPhotoResponse photoResp =
        new AnalyzeMealPhotoResponse(
            dishName,
            confidence,
            photoUrl,
            totalCalories,
            proteins,
            carbohydrates,
            fats,
            fibers,
            sodium,
            items,
            nutritionNotes);

    JsonNode usage = root.path("usageMetadata");
    int promptTokens = usage.path("promptTokenCount").asInt(260);
    int completionTokens = usage.path("candidatesTokenCount").asInt(280);
    int totalTokens = usage.path("totalTokenCount").asInt(540);

    return new GeminiVisionResult(photoResp, promptTokens, completionTokens, totalTokens);
  }

  private GeminiTextResult callGeminiFoodParserApi(
      String apiKey, String model, String text, String mealTypeHint) throws Exception {
    String endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/"
            + model
            + ":generateContent?key="
            + apiKey;

    String systemInstruction =
        "Você é o FoodParserAgent do GeLu Menu, nutricionista especialista em hábitos, gastronomia brasileira e análise de linguagem natural. "
            + "Receba a descrição livre em português do que o usuário comeu, identifique cada alimento, estime as porções com base em medidas caseiras usuais brasileiras "
            + "(colher de sopa = ~25g, concha = ~130g, bife médio = ~120g-150g, ovo = ~50g/70kcal, fatia de pão = ~25g/70kcal) e calcule os macronutrientes totais. "
            + "Responda ESTRITAMENTE em formato JSON com o seguinte schema:\n"
            + "{\n"
            + "  \"dishName\": \"Nome descritivo da refeição consumida\",\n"
            + "  \"confidence\": \"HIGH\",\n"
            + "  \"totalCalories\": 450.0,\n"
            + "  \"proteins\": 30.0,\n"
            + "  \"carbohydrates\": 50.0,\n"
            + "  \"fats\": 12.0,\n"
            + "  \"fibers\": 5.0,\n"
            + "  \"sodium\": 380.0,\n"
            + "  \"items\": [\n"
            + "    {\n"
            + "      \"name\": \"Alimento identificado\",\n"
            + "      \"portion\": \"150g (ou 1 unidade)\",\n"
            + "      \"calories\": 200.0,\n"
            + "      \"proteins\": 25.0,\n"
            + "      \"carbohydrates\": 0.0,\n"
            + "      \"fats\": 8.0\n"
            + "    }\n"
            + "  ],\n"
            + "  \"nutritionNotes\": \"Breve diagnóstico ou dica nutricional sobre a combinação de alimentos\"\n"
            + "}";

    String userPrompt =
        "Refeição descrita pelo usuário: \""
            + escapeJson(text)
            + "\""
            + (mealTypeHint != null ? "\nTipo de refeição pretendida: " + escapeJson(mealTypeHint) : "");

    String requestBody =
        "{"
            + "\"system_instruction\":{\"parts\":[{\"text\":\""
            + escapeJson(systemInstruction)
            + "\"}]},"
            + "\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\""
            + escapeJson(userPrompt)
            + "\"}]}],"
            + "\"generationConfig\":{\"responseMimeType\":\"application/json\",\"temperature\":0.2}"
            + "}";

    HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    HttpRequest req =
        HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(25))
            .build();

    HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
    if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
      throw new RuntimeException("Gemini Parser API error: " + resp.statusCode());
    }

    JsonNode root = objectMapper.readTree(resp.body());
    JsonNode textNode =
        root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
    if (textNode.isMissingNode()) {
      throw new RuntimeException("No text in Gemini Parser response");
    }

    JsonNode parsed = objectMapper.readTree(textNode.asText().trim());

    String dishName = parsed.path("dishName").asText("Refeição Identificada");
    Double totalCalories = parsed.path("totalCalories").asDouble(400.0);
    Double proteins = parsed.path("proteins").asDouble(25.0);
    Double carbohydrates = parsed.path("carbohydrates").asDouble(45.0);
    Double fats = parsed.path("fats").asDouble(10.0);
    Double fibers = parsed.path("fibers").asDouble(4.0);
    Double sodium = parsed.path("sodium").asDouble(350.0);
    String nutritionNotes =
        parsed
            .path("nutritionNotes")
            .asText("Refeição identificada com sucesso por inteligência artificial.");

    List<FoodItemIdentified> items = new ArrayList<>();
    JsonNode itemsNode = parsed.path("items");
    if (itemsNode.isArray()) {
      for (JsonNode item : itemsNode) {
        items.add(
            new FoodItemIdentified(
                item.path("name").asText("Alimento"),
                item.path("portion").asText("1 porção"),
                BigDecimal.valueOf(item.path("calories").asDouble(100.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("proteins").asDouble(5.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("carbohydrates").asDouble(10.0))
                    .setScale(1, RoundingMode.HALF_UP),
                BigDecimal.valueOf(item.path("fats").asDouble(2.0))
                    .setScale(1, RoundingMode.HALF_UP)));
      }
    }

    if (items.isEmpty()) {
      items.add(
          new FoodItemIdentified(
              dishName,
              "1 refeição",
              BigDecimal.valueOf(totalCalories).setScale(1, RoundingMode.HALF_UP),
              BigDecimal.valueOf(proteins).setScale(1, RoundingMode.HALF_UP),
              BigDecimal.valueOf(carbohydrates).setScale(1, RoundingMode.HALF_UP),
              BigDecimal.valueOf(fats).setScale(1, RoundingMode.HALF_UP)));
    }

    ParseMealTextResponse textResp =
        new ParseMealTextResponse(
            dishName,
            totalCalories,
            proteins,
            carbohydrates,
            fats,
            fibers,
            sodium,
            items,
            nutritionNotes);

    JsonNode usage = root.path("usageMetadata");
    int promptTokens = usage.path("promptTokenCount").asInt(180);
    int completionTokens = usage.path("candidatesTokenCount").asInt(220);
    int totalTokens = usage.path("totalTokenCount").asInt(400);

    return new GeminiTextResult(textResp, promptTokens, completionTokens, totalTokens);
  }

  private ParseMealTextResponse fallbackLocalFoodTextParser(String text, String mealType) {
    String lower = text != null ? text.toLowerCase() : "";
    List<FoodItemIdentified> items = new ArrayList<>();
    double cals = 0.0;
    double prots = 0.0;
    double carbs = 0.0;
    double fats = 0.0;

    if (lower.contains("ovo")) {
      int count = lower.contains("2 ovo") || lower.contains("dois ovo") ? 2 : 1;
      items.add(
          new FoodItemIdentified(
              "Ovo(s)",
              count + " unid.",
              BigDecimal.valueOf(count * 75.0),
              BigDecimal.valueOf(count * 6.5),
              BigDecimal.valueOf(count * 0.5),
              BigDecimal.valueOf(count * 5.0)));
      cals += count * 75.0;
      prots += count * 6.5;
      carbs += count * 0.5;
      fats += count * 5.0;
    }
    if (lower.contains("pão") || lower.contains("pao") || lower.contains("torrada")) {
      items.add(
          new FoodItemIdentified(
              "Pão / Torrada",
              "50g",
              BigDecimal.valueOf(130.0),
              BigDecimal.valueOf(4.0),
              BigDecimal.valueOf(24.0),
              BigDecimal.valueOf(1.5)));
      cals += 130.0;
      prots += 4.0;
      carbs += 24.0;
      fats += 1.5;
    }
    if (lower.contains("queijo")) {
      items.add(
          new FoodItemIdentified(
              "Queijo",
              "30g",
              BigDecimal.valueOf(95.0),
              BigDecimal.valueOf(6.5),
              BigDecimal.valueOf(1.0),
              BigDecimal.valueOf(7.5)));
      cals += 95.0;
      prots += 6.5;
      carbs += 1.0;
      fats += 7.5;
    }
    if (lower.contains("arroz")) {
      items.add(
          new FoodItemIdentified(
              "Arroz",
              "120g",
              BigDecimal.valueOf(150.0),
              BigDecimal.valueOf(3.0),
              BigDecimal.valueOf(32.0),
              BigDecimal.valueOf(0.5)));
      cals += 150.0;
      prots += 3.0;
      carbs += 32.0;
      fats += 0.5;
    }
    if (lower.contains("feijão") || lower.contains("feijao")) {
      items.add(
          new FoodItemIdentified(
              "Feijão",
              "130g",
              BigDecimal.valueOf(98.0),
              BigDecimal.valueOf(6.0),
              BigDecimal.valueOf(17.5),
              BigDecimal.valueOf(0.6)));
      cals += 98.0;
      prots += 6.0;
      carbs += 17.5;
      fats += 0.6;
    }
    if (lower.contains("frango")) {
      items.add(
          new FoodItemIdentified(
              "Frango Grelhado",
              "150g",
              BigDecimal.valueOf(240.0),
              BigDecimal.valueOf(32.0),
              BigDecimal.ZERO,
              BigDecimal.valueOf(5.0)));
      cals += 240.0;
      prots += 32.0;
      fats += 5.0;
    }
    if (lower.contains("carne") || lower.contains("bife") || lower.contains("patinho")) {
      items.add(
          new FoodItemIdentified(
              "Carne Bovina",
              "140g",
              BigDecimal.valueOf(260.0),
              BigDecimal.valueOf(30.0),
              BigDecimal.ZERO,
              BigDecimal.valueOf(12.0)));
      cals += 260.0;
      prots += 30.0;
      fats += 12.0;
    }
    if (lower.contains("banana")
        || lower.contains("fruta")
        || lower.contains("maçã")
        || lower.contains("maca")) {
      items.add(
          new FoodItemIdentified(
              "Fruta Fresca",
              "100g",
              BigDecimal.valueOf(80.0),
              BigDecimal.valueOf(1.0),
              BigDecimal.valueOf(20.0),
              BigDecimal.valueOf(0.3)));
      cals += 80.0;
      prots += 1.0;
      carbs += 20.0;
      fats += 0.3;
    }
    if (lower.contains("salada") || lower.contains("alface") || lower.contains("tomate")) {
      items.add(
          new FoodItemIdentified(
              "Salada / Legumes",
              "80g",
              BigDecimal.valueOf(30.0),
              BigDecimal.valueOf(1.5),
              BigDecimal.valueOf(5.0),
              BigDecimal.valueOf(0.5)));
      cals += 30.0;
      prots += 1.5;
      carbs += 5.0;
      fats += 0.5;
    }
    if (lower.contains("café") || lower.contains("cafe") || lower.contains("leite")) {
      items.add(
          new FoodItemIdentified(
              "Café com Leite",
              "150ml",
              BigDecimal.valueOf(50.0),
              BigDecimal.valueOf(3.0),
              BigDecimal.valueOf(5.0),
              BigDecimal.valueOf(2.0)));
      cals += 50.0;
      prots += 3.0;
      carbs += 5.0;
      fats += 2.0;
    }

    if (items.isEmpty()) {
      cals = 380.0;
      prots = 24.0;
      carbs = 45.0;
      fats = 10.0;
      items.add(
          new FoodItemIdentified(
              "Refeição Geral",
              "1 porção",
              BigDecimal.valueOf(cals),
              BigDecimal.valueOf(prots),
              BigDecimal.valueOf(carbs),
              BigDecimal.valueOf(fats)));
    }

    String dishName = (mealType != null && !mealType.isBlank()) ? mealType : "Refeição";
    if (items.size() <= 3) {
      dishName = items.stream().map(FoodItemIdentified::name).collect(Collectors.joining(" com "));
    }

    return new ParseMealTextResponse(
        dishName,
        Math.round(cals * 10.0) / 10.0,
        Math.round(prots * 10.0) / 10.0,
        Math.round(carbs * 10.0) / 10.0,
        Math.round(fats * 10.0) / 10.0,
        4.0,
        320.0,
        items,
        "Estimativa gerada pelo motor nutricional de linguagem natural de contingência GeLu.");
  }

  private AnalyzeMealPhotoResponse fallbackLocalFoodVision(
      String mealTypeHint, String notesHint, String photoUrl) {
    String meal =
        (mealTypeHint != null && !mealTypeHint.isBlank()) ? mealTypeHint : "Almoço Saudável";
    List<FoodItemIdentified> items =
        List.of(
            new FoodItemIdentified(
                "Proteína Grelhada / Magra",
                "150g",
                BigDecimal.valueOf(240.0),
                BigDecimal.valueOf(32.0),
                BigDecimal.ZERO,
                BigDecimal.valueOf(5.0)),
            new FoodItemIdentified(
                "Carboidrato Complexo (Arroz/Batata)",
                "120g",
                BigDecimal.valueOf(160.0),
                BigDecimal.valueOf(3.0),
                BigDecimal.valueOf(35.0),
                BigDecimal.valueOf(0.5)),
            new FoodItemIdentified(
                "Leguminosa / Vegetais Variados",
                "100g",
                BigDecimal.valueOf(80.0),
                BigDecimal.valueOf(4.0),
                BigDecimal.valueOf(12.0),
                BigDecimal.valueOf(1.0)));

    return new AnalyzeMealPhotoResponse(
        meal + " Balanceado",
        "MEDIUM",
        photoUrl,
        BigDecimal.valueOf(480.0),
        BigDecimal.valueOf(39.0),
        BigDecimal.valueOf(47.0),
        BigDecimal.valueOf(6.5),
        BigDecimal.valueOf(5.5),
        BigDecimal.valueOf(360.0),
        items,
        "Estimativa gerada pelo motor nutricional local de contingência GeLu.");
  }

  private String getWeekDayKey(LocalDate date) {
    return switch (date.getDayOfWeek()) {
      case MONDAY -> "SEG";
      case TUESDAY -> "TER";
      case WEDNESDAY -> "QUA";
      case THURSDAY -> "QUI";
      case FRIDAY -> "SEX";
      case SATURDAY -> "SAB";
      case SUNDAY -> "DOM";
    };
  }

  private MealLogResponse toResponse(MealLog entity) {
    List<FoodItemIdentified> items = new ArrayList<>();
    if (entity.getItemsJson() != null && !entity.getItemsJson().isBlank()) {
      try {
        items =
            objectMapper.readValue(
                entity.getItemsJson(), new TypeReference<List<FoodItemIdentified>>() {});
      } catch (Exception ignored) {
      }
    }

    return new MealLogResponse(
        entity.getId(),
        entity.getUserId(),
        entity.getFamilyId(),
        entity.getDietMealId(),
        entity.getMealType(),
        entity.getDishName(),
        entity.getPhotoUrl(),
        entity.getTotalCalories(),
        entity.getProteins(),
        entity.getCarbohydrates(),
        entity.getFats(),
        entity.getFibers(),
        entity.getSodium(),
        items,
        entity.getAiNotes(),
        entity.getStatus(),
        entity.getInputMethod(),
        entity.getRawInputText(),
        entity.getSkipReason(),
        entity.getConsumedAt(),
        entity.getCreatedAt());
  }

  private String escapeJson(String s) {
    if (s == null) return "";
    return s.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\b", "\\b")
        .replace("\f", "\\f")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private static class GeminiVisionResult {
    final AnalyzeMealPhotoResponse response;
    final int promptTokens;
    final int completionTokens;
    final int totalTokens;

    GeminiVisionResult(
        AnalyzeMealPhotoResponse response,
        int promptTokens,
        int completionTokens,
        int totalTokens) {
      this.response = response;
      this.promptTokens = promptTokens;
      this.completionTokens = completionTokens;
      this.totalTokens = totalTokens;
    }
  }

  private static class GeminiTextResult {
    final ParseMealTextResponse response;
    final int promptTokens;
    final int completionTokens;
    final int totalTokens;

    GeminiTextResult(
        ParseMealTextResponse response,
        int promptTokens,
        int completionTokens,
        int totalTokens) {
      this.response = response;
      this.promptTokens = promptTokens;
      this.completionTokens = completionTokens;
      this.totalTokens = totalTokens;
    }
  }
}
