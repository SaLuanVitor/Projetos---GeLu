package br.com.gelu.menu.recipes;

import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.recipes.dto.RecipeIngredientRequest;
import br.com.gelu.menu.recipes.dto.RecipeIngredientResponse;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeResponse;
import br.com.gelu.menu.recipes.dto.RecipeSearchFilter;
import br.com.gelu.menu.recipes.dto.RecipeStepRequest;
import br.com.gelu.menu.recipes.dto.RecipeStepResponse;
import br.com.gelu.menu.users.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeService {

  private final RecipeRepository recipeRepository;
  private final RecipeMediaRepository recipeMediaRepository;
  private final RecipeMediaService recipeMediaService;
  private final UserRepository userRepository;

  public RecipeService(
      RecipeRepository recipeRepository,
      RecipeMediaRepository recipeMediaRepository,
      RecipeMediaService recipeMediaService,
      UserRepository userRepository) {
    this.recipeRepository = recipeRepository;
    this.recipeMediaRepository = recipeMediaRepository;
    this.recipeMediaService = recipeMediaService;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<RecipeResponse> listRecipes(UUID userId, RecipeSearchFilter filter) {
    ensureUserExists(userId);
    return recipeRepository
        .search(
            userId,
            normalize(filter.query()),
            normalize(filter.ingredient()),
            normalize(filter.category()),
            filter.maxPrepTimeMinutes(),
            filter.maxCalories())
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public RecipeResponse createRecipe(UUID userId, RecipeRequest request) {
    ensureUserExists(userId);
    Recipe recipe =
        new Recipe(
            userId,
            request.name().trim(),
            normalize(request.description()),
            normalize(request.category()),
            request.prepTimeMinutes(),
            request.estimatedCalories(),
            request.servings(),
            normalize(request.videoUrl()));
    recipe.replaceIngredients(toIngredients(request.ingredients()));
    recipe.replaceSteps(toSteps(request.steps()));
    return toResponse(recipeRepository.save(recipe));
  }

  @Transactional(readOnly = true)
  public RecipeResponse getRecipe(UUID userId, UUID recipeId) {
    return toResponse(findOwnedRecipe(userId, recipeId));
  }

  @Transactional
  public RecipeResponse updateRecipe(UUID userId, UUID recipeId, RecipeRequest request) {
    Recipe recipe = findOwnedRecipe(userId, recipeId);
    recipe.update(
        request.name().trim(),
        normalize(request.description()),
        normalize(request.category()),
        request.prepTimeMinutes(),
        request.estimatedCalories(),
        request.servings(),
        normalize(request.videoUrl()));
    recipe.replaceIngredients(toIngredients(request.ingredients()));
    recipe.replaceSteps(toSteps(request.steps()));
    return toResponse(recipe);
  }

  @Transactional
  public void deleteRecipe(UUID userId, UUID recipeId) {
    Recipe recipe = findOwnedRecipe(userId, recipeId);
    recipeMediaService.deleteStorageForRecipe(userId, recipeId);
    recipeRepository.delete(recipe);
  }

  private Recipe findOwnedRecipe(UUID userId, UUID recipeId) {
    ensureUserExists(userId);
    return recipeRepository
        .findByIdAndUserId(recipeId, userId)
        .orElseThrow(() -> new NotFoundException("Recipe not found"));
  }

  private void ensureUserExists(UUID userId) {
    if (!userRepository.existsById(userId)) {
      throw new NotFoundException("User not found");
    }
  }

  private List<RecipeIngredient> toIngredients(List<RecipeIngredientRequest> requests) {
    return java.util.stream.IntStream.range(0, requests.size())
        .mapToObj(
            index -> {
              RecipeIngredientRequest request = requests.get(index);
              return new RecipeIngredient(
                  index + 1,
                  request.name().trim(),
                  normalize(request.quantity()),
                  normalize(request.unit()));
            })
        .toList();
  }

  private List<RecipeStep> toSteps(List<RecipeStepRequest> requests) {
    return java.util.stream.IntStream.range(0, requests.size())
        .mapToObj(index -> new RecipeStep(index + 1, requests.get(index).instruction().trim()))
        .toList();
  }

  private RecipeResponse toResponse(Recipe recipe) {
    var media =
        recipeMediaService.responses(
            recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(
                recipe.getId(), recipe.getUserId()));
    String mainImageUrl =
        media.stream()
            .filter(br.com.gelu.menu.recipes.dto.RecipeMediaResponse::main)
            .findFirst()
            .map(br.com.gelu.menu.recipes.dto.RecipeMediaResponse::url)
            .orElse(null);
    return new RecipeResponse(
        recipe.getId(),
        recipe.getName(),
        recipe.getDescription(),
        recipe.getCategory(),
        recipe.getPrepTimeMinutes(),
        recipe.getEstimatedCalories(),
        recipe.getServings(),
        recipe.getVideoUrl(),
        mainImageUrl,
        media,
        recipe.getIngredients().stream()
            .map(
                ingredient ->
                    new RecipeIngredientResponse(
                        ingredient.getId(),
                        ingredient.getPosition(),
                        ingredient.getName(),
                        ingredient.getQuantity(),
                        ingredient.getUnit()))
            .toList(),
        recipe.getSteps().stream()
            .map(
                step ->
                    new RecipeStepResponse(step.getId(), step.getPosition(), step.getInstruction()))
            .toList(),
        recipe.getCreatedAt(),
        recipe.getUpdatedAt());
  }

  private String normalize(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
