package br.com.gelu.menu.recipes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.recipes.dto.RecipeIngredientRequest;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeSearchFilter;
import br.com.gelu.menu.recipes.dto.RecipeStepRequest;
import br.com.gelu.menu.users.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class RecipeServiceTest {

  private final RecipeRepository recipeRepository =
      org.mockito.Mockito.mock(RecipeRepository.class);
  private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
  private final RecipeService recipeService = new RecipeService(recipeRepository, userRepository);

  @Test
  void shouldCreateRecipe() {
    UUID userId = UUID.randomUUID();
    when(userRepository.existsById(userId)).thenReturn(true);
    when(recipeRepository.save(any(Recipe.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var response = recipeService.createRecipe(userId, request(" Tapioca ", "Cafe"));

    assertThat(response.name()).isEqualTo("Tapioca");
    assertThat(response.category()).isEqualTo("Cafe");
    assertThat(response.ingredients()).hasSize(1);
    assertThat(response.ingredients().getFirst().position()).isEqualTo(1);
    assertThat(response.steps()).hasSize(1);
  }

  @Test
  void shouldListRecipesWithFilters() {
    UUID userId = UUID.randomUUID();
    Recipe recipe = recipe(userId, "Tapioca", "Cafe");
    when(userRepository.existsById(userId)).thenReturn(true);
    when(recipeRepository.search(userId, "tapioca", "goma", "Cafe", 30, new BigDecimal("400")))
        .thenReturn(List.of(recipe));

    var response =
        recipeService.listRecipes(
            userId,
            new RecipeSearchFilter(" tapioca ", " goma ", " Cafe ", 30, new BigDecimal("400")));

    assertThat(response).hasSize(1);
    assertThat(response.getFirst().name()).isEqualTo("Tapioca");
  }

  @Test
  void shouldUpdateOwnedRecipe() {
    UUID userId = UUID.randomUUID();
    Recipe recipe = recipe(userId, "Tapioca", "Cafe");
    when(userRepository.existsById(userId)).thenReturn(true);
    when(recipeRepository.findByIdAndUserId(recipe.getId(), userId))
        .thenReturn(Optional.of(recipe));

    var response =
        recipeService.updateRecipe(userId, recipe.getId(), request("Crepioca", "Jantar"));

    assertThat(response.name()).isEqualTo("Crepioca");
    assertThat(response.category()).isEqualTo("Jantar");
  }

  @Test
  void shouldDeleteOwnedRecipe() {
    UUID userId = UUID.randomUUID();
    Recipe recipe = recipe(userId, "Tapioca", "Cafe");
    when(userRepository.existsById(userId)).thenReturn(true);
    when(recipeRepository.findByIdAndUserId(recipe.getId(), userId))
        .thenReturn(Optional.of(recipe));

    recipeService.deleteRecipe(userId, recipe.getId());

    verify(recipeRepository).delete(recipe);
  }

  @Test
  void shouldRejectRecipeFromAnotherUser() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    when(userRepository.existsById(userId)).thenReturn(true);
    when(recipeRepository.findByIdAndUserId(recipeId, userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> recipeService.getRecipe(userId, recipeId))
        .isInstanceOf(NotFoundException.class)
        .hasMessage("Recipe not found");
  }

  private Recipe recipe(UUID userId, String name, String category) {
    Recipe recipe =
        new Recipe(userId, name, "Descricao", category, 20, new BigDecimal("320"), 2, null);
    recipe.replaceIngredients(List.of(new RecipeIngredient(1, "Goma", "2", "colheres")));
    recipe.replaceSteps(List.of(new RecipeStep(1, "Misture tudo.")));
    return recipe;
  }

  private RecipeRequest request(String name, String category) {
    return new RecipeRequest(
        name,
        " Receita simples ",
        category,
        20,
        new BigDecimal("320"),
        2,
        null,
        List.of(new RecipeIngredientRequest(" Goma ", "2", "colheres")),
        List.of(new RecipeStepRequest(" Misture tudo. ")));
  }
}
