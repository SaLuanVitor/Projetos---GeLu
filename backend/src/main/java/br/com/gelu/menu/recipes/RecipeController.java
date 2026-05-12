package br.com.gelu.menu.recipes;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeResponse;
import br.com.gelu.menu.recipes.dto.RecipeSearchFilter;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
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
@RequestMapping("/api/v1/recipes")
public class RecipeController {

  private final RecipeService recipeService;

  public RecipeController(RecipeService recipeService) {
    this.recipeService = recipeService;
  }

  @GetMapping
  public ApiResponse<List<RecipeResponse>> listRecipes(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String ingredient,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Integer maxPrepTimeMinutes,
      @RequestParam(required = false) BigDecimal maxCalories) {
    return ApiResponse.ok(
        recipeService.listRecipes(
            user.id(),
            new RecipeSearchFilter(query, ingredient, category, maxPrepTimeMinutes, maxCalories)),
        "Recipes loaded successfully");
  }

  @PostMapping
  public ApiResponse<RecipeResponse> createRecipe(
      @AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody RecipeRequest request) {
    return ApiResponse.ok(recipeService.createRecipe(user.id(), request), "Recipe created");
  }

  @GetMapping("/{id}")
  public ApiResponse<RecipeResponse> getRecipe(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return ApiResponse.ok(recipeService.getRecipe(user.id(), id), "Recipe loaded successfully");
  }

  @PutMapping("/{id}")
  public ApiResponse<RecipeResponse> updateRecipe(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @Valid @RequestBody RecipeRequest request) {
    return ApiResponse.ok(recipeService.updateRecipe(user.id(), id, request), "Recipe updated");
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteRecipe(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    recipeService.deleteRecipe(user.id(), id);
    return ApiResponse.ok(null, "Recipe deleted");
  }
}
