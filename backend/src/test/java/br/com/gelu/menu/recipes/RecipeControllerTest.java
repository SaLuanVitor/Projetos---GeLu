package br.com.gelu.menu.recipes;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.config.JwtAuthenticationFilter;
import br.com.gelu.menu.auth.config.SecurityConfig;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.recipes.dto.RecipeIngredientResponse;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeResponse;
import br.com.gelu.menu.recipes.dto.RecipeSearchFilter;
import br.com.gelu.menu.recipes.dto.RecipeStepResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RecipeController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class RecipeControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private RecipeService recipeService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectRecipesWithoutToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/recipes"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
  }

  @Test
  void shouldListRecipesWithFilters() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeService.listRecipes(eq(userId), any(RecipeSearchFilter.class)))
        .thenReturn(List.of(response(UUID.randomUUID(), "Tapioca")));

    mockMvc
        .perform(
            get("/api/v1/recipes")
                .header("Authorization", "Bearer access-token")
                .queryParam("query", "tapioca")
                .queryParam("ingredient", "goma")
                .queryParam("category", "Cafe")
                .queryParam("maxPrepTimeMinutes", "30")
                .queryParam("maxCalories", "400"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].name").value("Tapioca"));
  }

  @Test
  void shouldCreateRecipe() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeService.createRecipe(eq(userId), any(RecipeRequest.class)))
        .thenReturn(response(UUID.randomUUID(), "Tapioca"));

    mockMvc
        .perform(
            post("/api/v1/recipes")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload("Tapioca")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Tapioca"));
  }

  @Test
  void shouldRejectInvalidRecipePayload() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    mockMvc
        .perform(
            post("/api/v1/recipes")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "",
                      "ingredients": [],
                      "steps": []
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldLoadRecipeDetail() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeService.getRecipe(userId, recipeId)).thenReturn(response(recipeId, "Tapioca"));

    mockMvc
        .perform(
            get("/api/v1/recipes/{id}", recipeId).header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(recipeId.toString()));
  }

  @Test
  void shouldUpdateRecipe() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeService.updateRecipe(eq(userId), eq(recipeId), any(RecipeRequest.class)))
        .thenReturn(response(recipeId, "Crepioca"));

    mockMvc
        .perform(
            put("/api/v1/recipes/{id}", recipeId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validPayload("Crepioca")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Crepioca"));
  }

  @Test
  void shouldDeleteRecipe() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    doNothing().when(recipeService).deleteRecipe(userId, recipeId);

    mockMvc
        .perform(
            delete("/api/v1/recipes/{id}", recipeId).header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Recipe deleted"));
  }

  private RecipeResponse response(UUID id, String name) {
    return new RecipeResponse(
        id,
        name,
        "Descricao",
        "Cafe",
        20,
        new BigDecimal("320"),
        2,
        null,
        List.of(new RecipeIngredientResponse(UUID.randomUUID(), 1, "Goma", "2", "colheres")),
        List.of(new RecipeStepResponse(UUID.randomUUID(), 1, "Misture tudo.")),
        LocalDateTime.of(2026, 5, 10, 8, 30),
        LocalDateTime.of(2026, 5, 10, 8, 30));
  }

  private String validPayload(String name) {
    return """
        {
          "name": "%s",
          "description": "Receita simples",
          "category": "Cafe",
          "prepTimeMinutes": 20,
          "estimatedCalories": 320,
          "servings": 2,
          "videoUrl": null,
          "ingredients": [
            { "name": "Goma", "quantity": "2", "unit": "colheres" }
          ],
          "steps": [
            { "instruction": "Misture tudo." }
          ]
        }
        """
        .formatted(name);
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }
}
