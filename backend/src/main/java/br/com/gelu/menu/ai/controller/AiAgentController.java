package br.com.gelu.menu.ai.controller;

import br.com.gelu.menu.ai.AiSuggestionService;
import br.com.gelu.menu.ai.agents.AiAgentCatalog;
import br.com.gelu.menu.ai.agents.AiAgentDescriptor;
import br.com.gelu.menu.ai.dto.GenerateSuggestionRequest;
import br.com.gelu.menu.ai.dto.MealSuggestionResponse;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI Agents", description = "AI agent catalog and meal suggestions")
@RestController
@RequestMapping("/api/v1/ai")
public class AiAgentController {

  private final AiAgentCatalog catalog;
  private final AiSuggestionService suggestionService;

  public AiAgentController(AiAgentCatalog catalog, AiSuggestionService suggestionService) {
    this.catalog = catalog;
    this.suggestionService = suggestionService;
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
      @RequestBody GenerateSuggestionRequest request) {
    return ApiResponse.ok(
        suggestionService.generateSuggestion(user != null ? user.id() : null, request),
        "Meal suggestion generated successfully");
  }

  @Operation(summary = "Estimate recipe nutritional values")
  @PostMapping("/nutrition-estimate")
  public ApiResponse<br.com.gelu.menu.ai.dto.NutritionEstimateResponse> estimateNutrition(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody br.com.gelu.menu.ai.dto.NutritionEstimateRequest request) {
    return ApiResponse.ok(
        suggestionService.estimateNutrition(user != null ? user.id() : null, request),
        "Nutritional estimation generated successfully");
  }

  @Operation(summary = "Estimate workout calories burned")
  @PostMapping("/workout-calorie-estimate")
  public ApiResponse<br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateResponse> estimateWorkoutCalories(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody br.com.gelu.menu.ai.dto.WorkoutCalorieEstimateRequest request) {
    return ApiResponse.ok(
        suggestionService.estimateWorkoutCalories(user != null ? user.id() : null, request),
        "Workout calorie estimation generated successfully");
  }

  @Operation(summary = "Generate weekly evolution retrospective summary")
  @PostMapping("/weekly-summary")
  public ApiResponse<br.com.gelu.menu.ai.dto.WeeklyEvolutionSummaryResponse> generateWeeklySummary(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody(required = false) br.com.gelu.menu.ai.dto.WeeklySummaryRequest request) {
    return ApiResponse.ok(
        suggestionService.generateWeeklyEvolutionSummary(user != null ? user.id() : null, request),
        "Weekly evolution summary generated successfully");
  }

}
