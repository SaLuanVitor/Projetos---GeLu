package br.com.gelu.menu.recipes;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.recipes.dto.RecipeIngredientRequest;
import br.com.gelu.menu.recipes.dto.RecipeIngredientResponse;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeResponse;
import br.com.gelu.menu.recipes.dto.RecipeSearchFilter;
import br.com.gelu.menu.recipes.dto.RecipeStepRequest;
import br.com.gelu.menu.recipes.dto.RecipeStepResponse;
import br.com.gelu.menu.users.UserRepository;
import jakarta.persistence.criteria.JoinType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
        .findAll(
            toSpecification(userId, filter),
            Sort.by(Sort.Order.desc("favorite"), Sort.Order.desc("createdAt")))
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
  public RecipeResponse updateFavorite(UUID userId, UUID recipeId, boolean favorite) {
    Recipe recipe = findOwnedRecipe(userId, recipeId);
    recipe.setFavorite(favorite);
    return toResponse(recipe);
  }

  @Transactional
  public RecipeResponse updateMainMediaType(
      UUID userId, UUID recipeId, RecipeMainMediaType mainMediaType) {
    Recipe recipe = findOwnedRecipe(userId, recipeId);
    if (mainMediaType == RecipeMainMediaType.VIDEO && normalize(recipe.getVideoUrl()) == null) {
      throw new BadRequestException("Recipe video URL is required to use video as main media");
    }
    recipe.setMainMediaType(mainMediaType);
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
        recipe.isFavorite(),
        recipe.getMainMediaType().name(),
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

  private Specification<Recipe> toSpecification(UUID userId, RecipeSearchFilter filter) {
    return (root, query, criteriaBuilder) -> {
      List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
      predicates.add(criteriaBuilder.equal(root.get("userId"), userId));

      String textQuery = normalize(filter.query());
      if (textQuery != null) {
        String pattern = likePattern(textQuery);
        predicates.add(
            criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                criteriaBuilder.like(
                    criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("description"), "")),
                    pattern)));
      }

      String ingredient = normalize(filter.ingredient());
      if (ingredient != null) {
        query.distinct(true);
        var ingredientJoin = root.join("ingredients", JoinType.LEFT);
        predicates.add(
            criteriaBuilder.like(
                criteriaBuilder.lower(ingredientJoin.get("name")), likePattern(ingredient)));
      }

      String category = normalize(filter.category());
      if (category != null) {
        predicates.add(
            criteriaBuilder.equal(
                criteriaBuilder.lower(root.get("category")), category.toLowerCase()));
      }

      if (filter.maxPrepTimeMinutes() != null) {
        predicates.add(
            criteriaBuilder.lessThanOrEqualTo(
                root.get("prepTimeMinutes"), filter.maxPrepTimeMinutes()));
      }

      if (filter.maxCalories() != null) {
        predicates.add(
            criteriaBuilder.lessThanOrEqualTo(root.get("estimatedCalories"), filter.maxCalories()));
      }

      return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
    };
  }

  private String likePattern(String value) {
    return "%" + value.toLowerCase() + "%";
  }
}
