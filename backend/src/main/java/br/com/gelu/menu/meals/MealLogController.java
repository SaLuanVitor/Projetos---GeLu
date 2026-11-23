package br.com.gelu.menu.meals;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.meals.dto.AnalyzeMealPhotoResponse;
import br.com.gelu.menu.meals.dto.CreateMealLogRequest;
import br.com.gelu.menu.meals.dto.DailyMealSummaryResponse;
import br.com.gelu.menu.meals.dto.MealLogResponse;
import br.com.gelu.menu.media.ObjectStorageService;
import br.com.gelu.menu.media.StoredFile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Meal Logs & Food Vision", description = "AI visual food recognition and meal tracking")
@RestController
@RequestMapping("/api/v1/meals")
public class MealLogController {

  private final MealLogService mealLogService;
  private final ObjectStorageService objectStorageService;

  public MealLogController(
      MealLogService mealLogService, ObjectStorageService objectStorageService) {
    this.mealLogService = mealLogService;
    this.objectStorageService = objectStorageService;
  }

  @Operation(summary = "Analyze meal photo using FoodVisionAgent")
  @PostMapping(value = "/analyze-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<AnalyzeMealPhotoResponse> analyzeMealPhoto(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "mealTypeHint", required = false) String mealTypeHint,
      @RequestParam(value = "notesHint", required = false) String notesHint) {
    return ApiResponse.ok(
        mealLogService.analyzeMealPhoto(
            user != null ? user.id() : null, file, mealTypeHint, notesHint),
        "Meal photo analyzed successfully by FoodVisionAgent");
  }

  @Operation(summary = "Record a consumed meal in the daily diary")
  @PostMapping
  public ApiResponse<MealLogResponse> createMealLog(
      @AuthenticationPrincipal AuthenticatedUser user, @RequestBody CreateMealLogRequest request) {
    return ApiResponse.ok(
        mealLogService.saveMealLog(user.id(), request), "Meal registered successfully in diary");
  }

  @Operation(summary = "List meals consumed on a specific date")
  @GetMapping
  public ApiResponse<List<MealLogResponse>> listMeals(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    return ApiResponse.ok(
        mealLogService.listMealLogs(user.id(), date), "Daily meals loaded successfully");
  }

  @Operation(summary = "Get daily nutritional and caloric summary")
  @GetMapping("/daily-summary")
  public ApiResponse<DailyMealSummaryResponse> getDailySummary(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate date) {
    return ApiResponse.ok(
        mealLogService.getDailySummary(user.id(), date), "Daily summary loaded successfully");
  }

  @Operation(summary = "Delete a recorded meal")
  @DeleteMapping("/{mealLogId}")
  public ApiResponse<Void> deleteMealLog(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID mealLogId) {
    mealLogService.deleteMealLog(user.id(), mealLogId);
    return ApiResponse.ok(null, "Meal log deleted successfully");
  }

  @Operation(summary = "Serve a meal photo safely")
  @GetMapping("/photo/{photoKey}")
  public ResponseEntity<InputStreamResource> getMealPhoto(@PathVariable String photoKey) {
    String objectKey = "meal-photos/" + photoKey;
    String contentType = "image/jpeg";
    if (photoKey.endsWith(".png")) contentType = "image/png";
    else if (photoKey.endsWith(".webp")) contentType = "image/webp";

    StoredFile file = objectStorageService.get(objectKey, contentType, 0L);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, contentType)
        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)))
        .body(new InputStreamResource(file.content()));
  }
}
