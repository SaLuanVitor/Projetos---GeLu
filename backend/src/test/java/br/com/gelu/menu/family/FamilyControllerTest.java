package br.com.gelu.menu.family;

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
import br.com.gelu.menu.family.dto.AddFamilyMemberRequest;
import br.com.gelu.menu.family.dto.CreateFamilyRequest;
import br.com.gelu.menu.family.dto.FamilyMemberResponse;
import br.com.gelu.menu.family.dto.FamilyResponse;
import br.com.gelu.menu.family.dto.UpdateFamilyRequest;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

@WebMvcTest(FamilyController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class FamilyControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private FamilyService familyService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectWithoutToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/families"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
  }

  @Test
  void shouldListFamilies() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    FamilyResponse family = dummyFamilyResponse("Família Luan & Geovana", userId);
    when(familyService.listFamilies(userId)).thenReturn(List.of(family));

    mockMvc
        .perform(get("/api/v1/families").header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data[0].name").value("Família Luan & Geovana"));
  }

  @Test
  void shouldGetFamilyById() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    FamilyResponse family = dummyFamilyResponse("Família Luan & Geovana", userId);
    when(familyService.getFamily(userId, familyId)).thenReturn(family);

    mockMvc
        .perform(get("/api/v1/families/" + familyId).header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.name").value("Família Luan & Geovana"));
  }

  @Test
  void shouldCreateFamily() throws Exception {
    UUID userId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    FamilyResponse family = dummyFamilyResponse("Nova Família", userId);
    when(familyService.createFamily(eq(userId), any(CreateFamilyRequest.class))).thenReturn(family);

    mockMvc
        .perform(
            post("/api/v1/families")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    { "name": "Nova Família" }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Nova Família"));
  }

  @Test
  void shouldUpdateFamily() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    FamilyResponse updated = dummyFamilyResponse("Nome Atualizado", userId);
    when(familyService.updateFamily(eq(userId), eq(familyId), any(UpdateFamilyRequest.class)))
        .thenReturn(updated);

    mockMvc
        .perform(
            put("/api/v1/families/" + familyId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    { "name": "Nome Atualizado" }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Nome Atualizado"));
  }

  @Test
  void shouldDeleteFamily() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    doNothing().when(familyService).deleteFamily(userId, familyId);

    mockMvc
        .perform(
            delete("/api/v1/families/" + familyId).header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Family deleted successfully"));
  }

  @Test
  void shouldAddFamilyMember() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    FamilyResponse family = dummyFamilyResponse("Família", userId);
    when(familyService.addFamilyMember(eq(userId), eq(familyId), any(AddFamilyMemberRequest.class)))
        .thenReturn(family);

    mockMvc
        .perform(
            post("/api/v1/families/" + familyId + "/members")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    { "userId": "geovana@example.com", "role": "MEMBER" }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Família"));
  }

  @Test
  void shouldRemoveFamilyMember() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    String targetId = UUID.randomUUID().toString();
    mockAuthenticatedUser(userId);
    FamilyResponse family = dummyFamilyResponse("Família", userId);
    when(familyService.removeFamilyMember(userId, familyId, targetId)).thenReturn(family);

    mockMvc
        .perform(
            delete("/api/v1/families/" + familyId + "/members/" + targetId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Família"));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }

  private FamilyResponse dummyFamilyResponse(String name, UUID ownerId) {
    String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    FamilyMemberResponse member =
        new FamilyMemberResponse(
            UUID.randomUUID().toString(),
            ownerId.toString(),
            "Luan",
            "luan@example.com",
            "ADMIN",
            now);
    return new FamilyResponse(
        UUID.randomUUID().toString(), name, ownerId.toString(), List.of(member), now, now);
  }
}
