package br.com.gelu.menu.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import br.com.gelu.menu.ai.agents.AiAgentCatalog;
import br.com.gelu.menu.ai.agents.AiAgentDescriptor;
import br.com.gelu.menu.ai.dto.GenerateSuggestionRequest;
import br.com.gelu.menu.ai.dto.MealSuggestionResponse;
import br.com.gelu.menu.ai.idempotency.IdempotencyService;
import br.com.gelu.menu.ai.learning.UserHabitLearningService;
import br.com.gelu.menu.ai.lgpd.LgpdLifecycleService;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AiSuggestionControllerTest {

  private AiAgentCatalog catalog;
  private AiSuggestionService aiSuggestionService;
  private IdempotencyService idempotencyService;
  private UserHabitLearningService habitLearningService;
  private LgpdLifecycleService lgpdLifecycleService;
  private AiSuggestionController controller;

  @BeforeEach
  void setUp() {
    catalog = mock(AiAgentCatalog.class);
    aiSuggestionService = mock(AiSuggestionService.class);
    idempotencyService = mock(IdempotencyService.class);
    habitLearningService = mock(UserHabitLearningService.class);
    lgpdLifecycleService = mock(LgpdLifecycleService.class);
    controller = new AiSuggestionController(
        catalog,
        aiSuggestionService,
        idempotencyService,
        habitLearningService,
        lgpdLifecycleService);
  }

  @Test
  @DisplayName("Deve listar os agentes de IA disponíveis")
  void shouldListAgents() {
    when(catalog.listAgents()).thenReturn(List.of(
        new AiAgentDescriptor("food-vision", "FoodVision Agent", "Visual food analyzer", List.of("IMAGE"), List.of("TEXT"), ".codex/agents/food-vision.md")
    ));

    ApiResponse<List<AiAgentDescriptor>> response = controller.listAgents();

    assertThat(response.success()).isTrue();
    assertThat(response.data()).hasSize(1);
    assertThat(response.data().get(0).name()).isEqualTo("FoodVision Agent");
    verify(catalog).listAgents();
  }

  @Test
  @DisplayName("Deve delegar geração de sugestão para o service e retornar envelope ApiResponse")
  void shouldGenerateMealSuggestion() {
    UUID userId = UUID.randomUUID();
    AuthenticatedUser authUser = new AuthenticatedUser(userId);
    GenerateSuggestionRequest request =
        new GenerateSuggestionRequest("Almoço", "Equilíbrio", 450, "sem cebola", null);

    MealSuggestionResponse mockResponse =
        new MealSuggestionResponse(
            "Prato Teste",
            "Almoço",
            450,
            20,
            "Explicação",
            List.of("Arroz", "Frango"),
            "30g",
            "40g",
            "10g",
            "Dica",
            "GEMINI_AI",
            "Aviso",
            0.95,
            410,
            490,
            false);

    when(aiSuggestionService.generateSuggestion(eq(userId), any())).thenReturn(mockResponse);

    ApiResponse<MealSuggestionResponse> apiResponse =
        controller.generateSuggestion(authUser, null, request);

    assertThat(apiResponse.success()).isTrue();
    assertThat(apiResponse.data().title()).isEqualTo("Prato Teste");
    assertThat(apiResponse.data().source()).isEqualTo("GEMINI_AI");
    assertThat(apiResponse.data().confidenceScore()).isEqualTo(0.95);
    verify(aiSuggestionService).generateSuggestion(eq(userId), any());
  }

  @Test
  @DisplayName("Deve registrar feedback do usuário no learning service")
  void shouldRecordUserFeedback() {
    UUID userId = UUID.randomUUID();
    AuthenticatedUser authUser = new AuthenticatedUser(userId);
    var feedback = new UserHabitLearningService.UserFeedbackRequest(
        "Prato Teste", List.of("Frango"), true, 5.0, null);

    ApiResponse<Void> response = controller.submitFeedback(authUser, feedback);

    assertThat(response.success()).isTrue();
    verify(habitLearningService).recordFeedback(eq(userId), any());
  }

  @Test
  @DisplayName("Deve exportar dados de acordo com o Art. 18 da LGPD")
  void shouldExportLgpdData() {
    UUID userId = UUID.randomUUID();
    AuthenticatedUser authUser = new AuthenticatedUser(userId);

    var mockReport = new LgpdLifecycleService.LgpdExportReport(
        userId, "User", "user@test.com", "{}", Collections.emptyList(), LocalDateTime.now(), "Art. 18");
    when(lgpdLifecycleService.exportUserData(userId)).thenReturn(mockReport);

    var response = controller.exportLgpdData(authUser);

    assertThat(response.success()).isTrue();
    assertThat(response.data().userId()).isEqualTo(userId);
    verify(lgpdLifecycleService).exportUserData(userId);
  }
}
