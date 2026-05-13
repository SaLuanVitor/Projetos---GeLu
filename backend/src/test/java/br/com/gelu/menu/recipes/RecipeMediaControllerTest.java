package br.com.gelu.menu.recipes;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.config.JwtAuthenticationFilter;
import br.com.gelu.menu.auth.config.SecurityConfig;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.media.StoredFile;
import br.com.gelu.menu.recipes.dto.RecipeMediaResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.io.ByteArrayInputStream;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RecipeMediaController.class)
@AutoConfigureMockMvc
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class RecipeMediaControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private RecipeMediaService recipeMediaService;

  @MockBean private JwtTokenService jwtTokenService;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldUploadImage() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeMediaService.uploadMedia(eq(userId), eq(recipeId), any()))
        .thenReturn(response(recipeId, UUID.randomUUID(), true));

    mockMvc
        .perform(
            multipart("/api/v1/recipes/{recipeId}/media", recipeId)
                .file(new MockMultipartFile("file", "foto.png", "image/png", "image".getBytes()))
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.main").value(true));
  }

  @Test
  void shouldListImages() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeMediaService.listMedia(userId, recipeId))
        .thenReturn(List.of(response(recipeId, UUID.randomUUID(), true)));

    mockMvc
        .perform(
            get("/api/v1/recipes/{recipeId}/media", recipeId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].fileName").value("foto.png"));
  }

  @Test
  void shouldSetMainImage() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    UUID mediaId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeMediaService.setMain(userId, recipeId, mediaId))
        .thenReturn(response(recipeId, mediaId, true));

    mockMvc
        .perform(
            put("/api/v1/recipes/{recipeId}/media/{mediaId}/main", recipeId, mediaId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.main").value(true));
  }

  @Test
  void shouldDeleteImage() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    UUID mediaId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    doNothing().when(recipeMediaService).deleteMedia(userId, recipeId, mediaId);

    mockMvc
        .perform(
            delete("/api/v1/recipes/{recipeId}/media/{mediaId}", recipeId, mediaId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Image deleted"));
  }

  @Test
  void shouldStreamImageContent() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    UUID mediaId = UUID.randomUUID();
    mockAuthenticatedUser(userId);
    when(recipeMediaService.getContent(userId, recipeId, mediaId))
        .thenReturn(new StoredFile(new ByteArrayInputStream("image".getBytes()), "image/png", 5));

    mockMvc
        .perform(
            get("/api/v1/recipes/{recipeId}/media/{mediaId}/content", recipeId, mediaId)
                .header("Authorization", "Bearer access-token"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.IMAGE_PNG))
        .andExpect(content().bytes("image".getBytes()));
  }

  private RecipeMediaResponse response(UUID recipeId, UUID mediaId, boolean main) {
    return new RecipeMediaResponse(
        mediaId,
        "foto.png",
        "image/png",
        1024,
        main,
        "/api/v1/recipes/%s/media/%s/content".formatted(recipeId, mediaId),
        LocalDateTime.of(2026, 5, 10, 8, 30));
  }

  private void mockAuthenticatedUser(UUID userId) {
    User user = new User("Luan", "luan@example.com", "password-hash");
    org.springframework.test.util.ReflectionTestUtils.setField(user, "id", userId);
    when(jwtTokenService.validateAccessToken("access-token")).thenReturn(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
  }
}
