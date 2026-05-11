package br.com.gelu.menu.users;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.config.JwtAuthenticationFilter;
import br.com.gelu.menu.auth.config.SecurityConfig;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.users.dto.ProfileResponse;
import br.com.gelu.menu.users.dto.UpdateProfileRequest;
import br.com.gelu.menu.users.dto.WeightHistoryItem;
import java.math.BigDecimal;
import java.time.LocalDate;
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

@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class ProfileControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private ProfileService profileService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectProfileWithoutToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/profile/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
  }

  @Test
  void shouldLoadProfileWithToken() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(profileService.getProfile(userId))
        .thenReturn(
            new ProfileResponse(
                userId,
                "Luan",
                "luan@example.com",
                LocalDate.of(1998, 5, 10),
                new BigDecimal("178.50"),
                new BigDecimal("82.30"),
                "MASCULINO",
                "Emagrecer",
                new BigDecimal("1800.00"),
                new BigDecimal("2200.00"),
                true,
                LocalDateTime.of(2026, 5, 10, 8, 30)));

    mockMvc
        .perform(get("/api/v1/profile/me").header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.email").value("luan@example.com"))
        .andExpect(jsonPath("$.data.currentWeight").value(82.30));
  }

  @Test
  void shouldUpdateProfile() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(profileService.updateProfile(eq(userId), any(UpdateProfileRequest.class)))
        .thenReturn(
            new ProfileResponse(
                userId,
                "Luan Vilar",
                "luan@example.com",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                LocalDateTime.now()));

    mockMvc
        .perform(
            put("/api/v1/profile/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Luan Vilar",
                      "birthDate": null,
                      "heightCm": null,
                      "biologicalSex": null,
                      "goal": null,
                      "basalCalories": null,
                      "dailyCalorieGoal": null
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Luan Vilar"));
  }

  @Test
  void shouldRejectInvalidProfilePayload() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    mockMvc
        .perform(
            put("/api/v1/profile/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "",
                      "heightCm": 0
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldCreateWeightRecord() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID weightId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(profileService.createWeightRecord(eq(userId), any()))
        .thenReturn(
            new WeightHistoryItem(
                weightId,
                new BigDecimal("82.30"),
                LocalDateTime.of(2026, 5, 10, 8, 30),
                LocalDateTime.of(2026, 5, 10, 8, 31)));

    mockMvc
        .perform(
            post("/api/v1/profile/weight-history")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "weightKg": 82.30,
                      "recordedAt": "2026-05-10T08:30:00"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.weightKg").value(82.30));
  }

  @Test
  void shouldListWeightHistory() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(profileService.listWeightHistory(userId))
        .thenReturn(
            List.of(
                new WeightHistoryItem(
                    UUID.randomUUID(),
                    new BigDecimal("82.30"),
                    LocalDateTime.of(2026, 5, 10, 8, 30),
                    LocalDateTime.of(2026, 5, 10, 8, 31))));

    mockMvc
        .perform(
            get("/api/v1/profile/weight-history").header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].weightKg").value(82.30));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }
}
