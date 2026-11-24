package br.com.gelu.menu.ai;

import br.com.gelu.menu.ai.agents.AiAgentCatalog;
import br.com.gelu.menu.ai.agents.AiAgentDescriptor;
import br.com.gelu.menu.ai.dto.GenerateSuggestionRequest;
import br.com.gelu.menu.ai.dto.MealSuggestionResponse;
import br.com.gelu.menu.ai.dto.NutritionEstimateRequest;
import br.com.gelu.menu.ai.dto.NutritionEstimateResponse;
import br.com.gelu.menu.ai.dto.WeeklyEvolutionSummaryResponse;
import br.com.gelu.menu.ai.dto.WeeklySummaryRequest;
import br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateRequest;
import br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateResponse;
import br.com.gelu.menu.ai.idempotency.IdempotencyService;
import br.com.gelu.menu.ai.learning.UserHabitLearningService;
import br.com.gelu.menu.ai.lgpd.LgpdLifecycleService;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "AI Agents & Suggestions", description = "Catálogo de agentes de IA, sugestões nutricionais e governança LGPD")
@RestController
@RequestMapping("/api/v1/ai")
public class AiSuggestionController {

  private final AiAgentCatalog catalog;
  private final AiSuggestionService aiSuggestionService;
  private final IdempotencyService idempotencyService;
  private final UserHabitLearningService habitLearningService;
  private final LgpdLifecycleService lgpdLifecycleService;

  public AiSuggestionController(
      AiAgentCatalog catalog,
      AiSuggestionService aiSuggestionService,
      IdempotencyService idempotencyService,
      UserHabitLearningService habitLearningService,
      LgpdLifecycleService lgpdLifecycleService) {
    this.catalog = catalog;
    this.aiSuggestionService = aiSuggestionService;
    this.idempotencyService = idempotencyService;
    this.habitLearningService = habitLearningService;
    this.lgpdLifecycleService = lgpdLifecycleService;
  }

  @Operation(summary = "List available AI agents")
  @GetMapping("/agents")
  public ApiResponse<List<AiAgentDescriptor>> listAgents() {
    return ApiResponse.ok(catalog.listAgents(), "AI agent catalog loaded");
  }

  @Operation(summary = "Generate smart meal suggestion")
  @PostMapping("/suggest")
  public ApiResponse<MealSuggestionResponse> generateSuggestion(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
      @Valid @RequestBody GenerateSuggestionRequest request) {
    if (idempotencyKey != null && idempotencyService.hasResponse(idempotencyKey)) {
      MealSuggestionResponse cached = idempotencyService.getResponse(idempotencyKey, MealSuggestionResponse.class);
      if (cached != null) {
        return ApiResponse.ok(cached, "Sugestão recuperada do cache de idempotência");
      }
    }

    UUID userId = user != null ? user.id() : null;
    MealSuggestionResponse response = aiSuggestionService.generateSuggestion(userId, request);

    if (idempotencyKey != null) {
      idempotencyService.saveResponse(idempotencyKey, response);
    }

    return ApiResponse.ok(response, "Sugestão gerada com sucesso");
  }

  @PostMapping("/nutrition-estimate")
  public ApiResponse<NutritionEstimateResponse> estimateNutrition(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
      @Valid @RequestBody NutritionEstimateRequest request) {
    if (idempotencyKey != null && idempotencyService.hasResponse(idempotencyKey)) {
      NutritionEstimateResponse cached = idempotencyService.getResponse(idempotencyKey, NutritionEstimateResponse.class);
      if (cached != null) {
        return ApiResponse.ok(cached, "Estimativa recuperada do cache de idempotência");
      }
    }

    UUID userId = user != null ? user.id() : null;
    NutritionEstimateResponse response = aiSuggestionService.estimateNutrition(userId, request);

    if (idempotencyKey != null) {
      idempotencyService.saveResponse(idempotencyKey, response);
    }

    return ApiResponse.ok(response, "Estimativa nutricional calculada com sucesso");
  }

  @PostMapping("/workout-calorie-estimate")
  public ApiResponse<WorkoutCalorieEstimateResponse> estimateWorkoutCalories(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody WorkoutCalorieEstimateRequest request) {
    UUID userId = user != null ? user.id() : null;
    WorkoutCalorieEstimateResponse response =
        aiSuggestionService.estimateWorkoutCalories(userId, request);
    return ApiResponse.ok(response, "Estimativa de treino calculada com sucesso");
  }

  @PostMapping("/weekly-summary")
  public ApiResponse<WeeklyEvolutionSummaryResponse> generateWeeklySummary(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody WeeklySummaryRequest request) {
    UUID userId = user != null ? user.id() : null;
    WeeklyEvolutionSummaryResponse response =
        aiSuggestionService.generateWeeklyEvolutionSummary(userId, request);
    return ApiResponse.ok(response, "Resumo semanal consolidado com sucesso");
  }

  @PostMapping("/feedback")
  public ApiResponse<Void> submitFeedback(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody UserHabitLearningService.UserFeedbackRequest feedback) {
    if (user != null) {
      habitLearningService.recordFeedback(user.id(), feedback);
    }
    return ApiResponse.ok(null, "Feedback nutricional registrado com sucesso no perfil de aprendizado contínuo");
  }

  @GetMapping("/lgpd/export")
  public ApiResponse<LgpdLifecycleService.LgpdExportReport> exportLgpdData(
      @AuthenticationPrincipal AuthenticatedUser user) {
    UUID userId = user != null ? user.id() : null;
    if (userId == null) {
      throw new IllegalArgumentException("Usuário não autenticado para exportação LGPD.");
    }
    var report = lgpdLifecycleService.exportUserData(userId);
    return ApiResponse.ok(report, "Exportação de dados pessoais LGPD Art. 18 concluída");
  }

  @DeleteMapping("/lgpd/data")
  public ApiResponse<LgpdLifecycleService.LgpdPurgeResult> purgeLgpdData(
      @AuthenticationPrincipal AuthenticatedUser user) {
    UUID userId = user != null ? user.id() : null;
    if (userId == null) {
      throw new IllegalArgumentException("Usuário não autenticado para exclusão de dados.");
    }
    var result = lgpdLifecycleService.purgeUserData(userId);
    return ApiResponse.ok(result, "Dados de IA e hábitos do usuário eliminados com sucesso (LGPD Art. 16)");
  }
}
