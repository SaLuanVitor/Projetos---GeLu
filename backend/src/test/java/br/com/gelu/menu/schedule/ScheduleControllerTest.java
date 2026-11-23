package br.com.gelu.menu.schedule;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.config.JwtAuthenticationFilter;
import br.com.gelu.menu.auth.config.SecurityConfig;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.schedule.dto.FamilyWeeklyGoalResponse;
import br.com.gelu.menu.schedule.dto.ScheduleActivityRequest;
import br.com.gelu.menu.schedule.dto.ScheduleActivityResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
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

@WebMvcTest(ScheduleController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class ScheduleControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private ScheduleService scheduleService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectWithoutToken() throws Exception {
    mockMvc
        .perform(
            get("/api/v1/schedule/activities").queryParam("familyId", UUID.randomUUID().toString()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldListActivities() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    ScheduleActivityResponse activity =
        new ScheduleActivityResponse(
            UUID.randomUUID().toString(),
            familyId.toString(),
            "SEG",
            "08:30",
            "12:00",
            "Trabalho — manhã",
            "TRABALHO",
            "Foco nas entregas",
            null,
            null,
            null,
            null,
            null,
            List.of(),
            0,
            false);

    when(scheduleService.listActivities(eq(userId), eq(familyId), any(), any()))
        .thenReturn(List.of(activity));

    mockMvc
        .perform(
            get("/api/v1/schedule/activities")
                .header("Authorization", "Bearer access-token")
                .queryParam("familyId", familyId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].title").value("Trabalho — manhã"));
  }

  @Test
  void shouldCreateActivity() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    ScheduleActivityResponse activity =
        new ScheduleActivityResponse(
            UUID.randomUUID().toString(),
            familyId.toString(),
            "SEG",
            "18:00",
            "19:30",
            "Academia — treino A",
            "SAUDE",
            null,
            "academia",
            null,
            null,
            null,
            null,
            List.of(),
            1,
            false);

    when(scheduleService.createActivity(eq(userId), any(ScheduleActivityRequest.class)))
        .thenReturn(activity);

    mockMvc
        .perform(
            post("/api/v1/schedule/activities")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "familyId": "%s",
                      "dayOfWeek": "SEG",
                      "startTime": "18:00",
                      "endTime": "19:30",
                      "title": "Academia — treino A",
                      "category": "SAUDE",
                      "goalTag": "academia"
                    }
                    """
                        .formatted(familyId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Academia — treino A"));
  }

  @Test
  void shouldToggleActivityCompletion() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    when(scheduleService.toggleCompletion(eq(userId), eq(activityId), any())).thenReturn(true);

    mockMvc
        .perform(
            post("/api/v1/schedule/activities/" + activityId + "/toggle")
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.completed").value(true));
  }

  @Test
  void shouldListGoals() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    FamilyWeeklyGoalResponse goal =
        new FamilyWeeklyGoalResponse(
            UUID.randomUUID().toString(),
            familyId.toString(),
            "Academia",
            "academia",
            3,
            "vezes",
            2,
            66.6);

    when(scheduleService.listGoals(eq(userId), eq(familyId), any())).thenReturn(List.of(goal));

    mockMvc
        .perform(
            get("/api/v1/schedule/goals")
                .header("Authorization", "Bearer access-token")
                .queryParam("familyId", familyId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].title").value("Academia"))
        .andExpect(jsonPath("$.data[0].currentCount").value(2));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }
}
