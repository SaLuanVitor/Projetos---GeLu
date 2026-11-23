package br.com.gelu.menu.couplenotes;

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
import br.com.gelu.menu.couplenotes.dto.CoupleNoteResponse;
import br.com.gelu.menu.couplenotes.dto.CreateCoupleNoteRequest;
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

@WebMvcTest(CoupleNoteController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class CoupleNoteControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private CoupleNoteService noteService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRejectWithoutToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/couple-notes").queryParam("familyId", UUID.randomUUID().toString()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldListNotes() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    CoupleNoteResponse note = dummyNote(familyId, userId, "Deixei o jantar na geladeira");
    when(noteService.listNotes(userId, familyId, false)).thenReturn(List.of(note));

    mockMvc
        .perform(
            get("/api/v1/couple-notes")
                .header("Authorization", "Bearer access-token")
                .queryParam("familyId", familyId.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data[0].content").value("Deixei o jantar na geladeira"));
  }

  @Test
  void shouldCreateNote() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID familyId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    CoupleNoteResponse note = dummyNote(familyId, userId, "Passear com a Ellie");
    when(noteService.createNote(eq(userId), any(CreateCoupleNoteRequest.class))).thenReturn(note);

    mockMvc
        .perform(
            post("/api/v1/couple-notes")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "familyId": "%s",
                      "content": "Passear com a Ellie",
                      "category": "LEMBRETE",
                      "color": "yellow",
                      "pinned": true
                    }
                    """
                        .formatted(familyId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content").value("Passear com a Ellie"));
  }

  @Test
  void shouldAcknowledgeNote() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID noteId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    CoupleNoteResponse note = dummyNote(UUID.randomUUID(), userId, "Aviso");
    when(noteService.acknowledgeNote(userId, noteId)).thenReturn(note);

    mockMvc
        .perform(
            post("/api/v1/couple-notes/" + noteId + "/acknowledge")
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void shouldResolveNote() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID noteId = UUID.randomUUID();
    mockAuthenticatedUser(userId);

    CoupleNoteResponse note = dummyNote(UUID.randomUUID(), userId, "Aviso");
    when(noteService.resolveNote(userId, noteId, true)).thenReturn(note);

    mockMvc
        .perform(
            put("/api/v1/couple-notes/" + noteId + "/resolve")
                .header("Authorization", "Bearer access-token")
                .queryParam("resolved", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));
  }

  @Test
  void shouldDeleteNote() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID noteId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    doNothing().when(noteService).deleteNote(userId, noteId);

    mockMvc
        .perform(
            delete("/api/v1/couple-notes/" + noteId).header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Note deleted successfully"));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }

  private CoupleNoteResponse dummyNote(UUID familyId, UUID userId, String content) {
    String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    return new CoupleNoteResponse(
        UUID.randomUUID().toString(),
        familyId.toString(),
        userId.toString(),
        "Luan",
        content,
        "RECADO",
        "yellow",
        true,
        null,
        null,
        false,
        now);
  }
}
