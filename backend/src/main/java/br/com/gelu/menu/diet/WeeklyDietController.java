package br.com.gelu.menu.diet;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.diet.dto.CopyWeeklyDietRequest;
import br.com.gelu.menu.diet.dto.CreateDietMealRequest;
import br.com.gelu.menu.diet.dto.DietMealResponse;
import br.com.gelu.menu.diet.dto.UpdateDietMealRequest;
import br.com.gelu.menu.diet.dto.WeeklyDietResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
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
@RequestMapping("/api/v1/weekly-diets")
public class WeeklyDietController {

  private final WeeklyDietService dietService;

  public WeeklyDietController(WeeklyDietService dietService) {
    this.dietService = dietService;
  }

  @GetMapping
  public ApiResponse<WeeklyDietResponse> getOrCreateWeeklyDiet(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) UUID familyId,
      @RequestParam(required = false) Boolean personal,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate weekStart) {
    WeeklyDietResponse response = dietService.getOrCreateWeeklyDiet(user.id(), familyId, personal, weekStart);
    return ApiResponse.ok(response, "Weekly diet loaded successfully");
  }

  @PostMapping("/{dietId}/meals")
  public ApiResponse<DietMealResponse> addMeal(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID dietId,
      @Valid @RequestBody CreateDietMealRequest request) {
    DietMealResponse response = dietService.addMeal(user.id(), dietId, request);
    return ApiResponse.ok(response, "Meal added successfully");
  }

  @PutMapping("/meals/{mealId}")
  public ApiResponse<DietMealResponse> updateMeal(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID mealId,
      @Valid @RequestBody UpdateDietMealRequest request) {
    DietMealResponse response = dietService.updateMeal(user.id(), mealId, request);
    return ApiResponse.ok(response, "Meal updated successfully");
  }

  @DeleteMapping("/meals/{mealId}")
  public ApiResponse<Void> deleteMeal(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID mealId) {
    dietService.deleteMeal(user.id(), mealId);
    return ApiResponse.ok(null, "Meal deleted successfully");
  }

  @PostMapping("/{dietId}/copy")
  public ApiResponse<WeeklyDietResponse> copyWeeklyDiet(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID dietId,
      @Valid @RequestBody CopyWeeklyDietRequest request) {
    WeeklyDietResponse response = dietService.copyWeeklyDiet(user.id(), dietId, request);
    return ApiResponse.ok(response, "Weekly diet copied successfully");
  }
}
