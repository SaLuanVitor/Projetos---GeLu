package br.com.gelu.menu.diet;

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
import br.com.gelu.menu.diet.dto.CopyWeeklyDietRequest;
import br.com.gelu.menu.diet.dto.CreateDietMealRequest;
import br.com.gelu.menu.diet.dto.DietMealResponse;
import br.com.gelu.menu.diet.dto.UpdateDietMealRequest;
import br.com.gelu.menu.diet.dto.WeeklyDietResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.math.BigDecimal;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WeeklyDietController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class WeeklyDietControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private WeeklyDietService dietService;
  @MockBean private JwtTokenService jwtTokenService;
  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectWithoutToken() throws Exception {
    mockMvc.perform(get("/api/v1/weekly-diets")).andExpect(status().isUnauthorized());
  }

  @Test
  void shouldGetOrCreateWeeklyDiet() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    WeeklyDietResponse dummy =
        new WeeklyDietResponse(
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
            userId.toString(),
            "Cardápio Semanal",
            "2026-11-16",
            "2026-11-22",
            List.of());

    when(dietService.getOrCreateWeeklyDiet(eq(userId), any(), any())).thenReturn(dummy);

    mockMvc
        .perform(get("/api/v1/weekly-diets").header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.title").value("Cardápio Semanal"));
  }

  @Test
  void shouldAddMeal() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID dietId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    DietMealResponse mealResponse =
        new DietMealResponse(
            UUID.randomUUID().toString(),
            dietId.toString(),
            "SEG",
            "Almoço",
            "12:30",
            "Frango com legumes",
            1,
            List.of(),
            List.of(),
            BigDecimal.valueOf(450));

    when(dietService.addMeal(eq(userId), eq(dietId), any(CreateDietMealRequest.class)))
        .thenReturn(mealResponse);

    mockMvc
        .perform(
            post("/api/v1/weekly-diets/" + dietId + "/meals")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "weekDay": "SEG",
                      "mealName": "Almoço",
                      "mealTime": "12:30",
                      "notes": "Frango com legumes"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.mealName").value("Almoço"));
  }

  @Test
  void shouldUpdateMeal() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID mealId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    DietMealResponse mealResponse =
        new DietMealResponse(
            mealId.toString(),
            UUID.randomUUID().toString(),
            "TER",
            "Jantar",
            "19:30",
            "Omelete",
            2,
            List.of(),
            List.of(),
            BigDecimal.valueOf(320));

    when(dietService.updateMeal(eq(userId), eq(mealId), any(UpdateDietMealRequest.class)))
        .thenReturn(mealResponse);

    mockMvc
        .perform(
            put("/api/v1/weekly-diets/meals/" + mealId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "weekDay": "TER",
                      "mealName": "Jantar",
                      "mealTime": "19:30",
                      "notes": "Omelete"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.mealName").value("Jantar"));
  }

  @Test
  void shouldDeleteMeal() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID mealId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    doNothing().when(dietService).deleteMeal(userId, mealId);

    mockMvc
        .perform(
            delete("/api/v1/weekly-diets/meals/" + mealId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void shouldCopyWeeklyDiet() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID dietId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    WeeklyDietResponse copied =
        new WeeklyDietResponse(
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
            userId.toString(),
            "Cardápio Semanal Copiado",
            "2026-11-23",
            "2026-11-29",
            List.of());

    when(dietService.copyWeeklyDiet(eq(userId), eq(dietId), any(CopyWeeklyDietRequest.class)))
        .thenReturn(copied);

    mockMvc
        .perform(
            post("/api/v1/weekly-diets/" + dietId + "/copy")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "targetWeekStart": "2026-11-23"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Cardápio Semanal Copiado"));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "hash");
    ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }
}
