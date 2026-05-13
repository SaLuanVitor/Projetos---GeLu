package br.com.gelu.menu.recipes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.media.ObjectStorageService;
import br.com.gelu.menu.media.StorageProperties;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class RecipeMediaServiceTest {

  private final RecipeRepository recipeRepository =
      org.mockito.Mockito.mock(RecipeRepository.class);
  private final RecipeMediaRepository recipeMediaRepository =
      org.mockito.Mockito.mock(RecipeMediaRepository.class);
  private final ObjectStorageService objectStorageService =
      org.mockito.Mockito.mock(ObjectStorageService.class);
  private final StorageProperties storageProperties =
      new StorageProperties(
          "http://localhost:9000",
          "gelu_menu",
          "gelu_menu123",
          "gelu-menu-media",
          "/api/v1/recipes",
          5 * 1024 * 1024);
  private final RecipeMediaService recipeMediaService =
      new RecipeMediaService(
          recipeRepository, recipeMediaRepository, objectStorageService, storageProperties);

  @Test
  void shouldUploadFirstImageAsMain() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    when(recipeRepository.findByIdAndUserId(recipeId, userId))
        .thenReturn(Optional.of(recipe(userId)));
    when(recipeMediaRepository.existsByRecipeIdAndUserId(recipeId, userId)).thenReturn(false);
    when(recipeMediaRepository.save(any(RecipeMedia.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var response =
        recipeMediaService.uploadMedia(
            userId,
            recipeId,
            new MockMultipartFile("file", "foto.png", "image/png", "content".getBytes()));

    assertThat(response.main()).isTrue();
    assertThat(response.url()).contains("/api/v1/recipes/%s/media/".formatted(recipeId));
    verify(objectStorageService).put(any(), any(), eq(7L), eq("image/png"));
  }

  @Test
  void shouldRejectUnsupportedImageType() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    when(recipeRepository.findByIdAndUserId(recipeId, userId))
        .thenReturn(Optional.of(recipe(userId)));

    assertThatThrownBy(
            () ->
                recipeMediaService.uploadMedia(
                    userId,
                    recipeId,
                    new MockMultipartFile("file", "file.txt", "text/plain", "x".getBytes())))
        .isInstanceOf(BadRequestException.class)
        .hasMessage("Unsupported image type");
  }

  @Test
  void shouldBlockRecipeFromAnotherUser() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    when(recipeRepository.findByIdAndUserId(recipeId, userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> recipeMediaService.listMedia(userId, recipeId))
        .isInstanceOf(NotFoundException.class)
        .hasMessage("Recipe not found");
  }

  @Test
  void shouldSetMainImage() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    RecipeMedia current = media(userId, recipeId, true);
    RecipeMedia selected = media(userId, recipeId, false);
    when(recipeRepository.findByIdAndUserId(recipeId, userId))
        .thenReturn(Optional.of(recipe(userId)));
    when(recipeMediaRepository.findByIdAndRecipeIdAndUserId(selected.getId(), recipeId, userId))
        .thenReturn(Optional.of(selected));
    when(recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId))
        .thenReturn(List.of(current, selected));

    var response = recipeMediaService.setMain(userId, recipeId, selected.getId());

    assertThat(response.main()).isTrue();
    assertThat(current.isMain()).isFalse();
  }

  @Test
  void shouldDeleteMediaAndPromoteNextImage() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    RecipeMedia deleted = media(userId, recipeId, true);
    RecipeMedia next = media(userId, recipeId, false);
    when(recipeRepository.findByIdAndUserId(recipeId, userId))
        .thenReturn(Optional.of(recipe(userId)));
    when(recipeMediaRepository.findByIdAndRecipeIdAndUserId(deleted.getId(), recipeId, userId))
        .thenReturn(Optional.of(deleted));
    when(recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId))
        .thenReturn(List.of(next));

    recipeMediaService.deleteMedia(userId, recipeId, deleted.getId());

    verify(recipeMediaRepository).delete(deleted);
    verify(objectStorageService).remove(deleted.getObjectKey());
    assertThat(next.isMain()).isTrue();
  }

  private Recipe recipe(UUID userId) {
    return new Recipe(userId, "Tapioca", "Descricao", "Cafe", 20, null, 2, null);
  }

  private RecipeMedia media(UUID userId, UUID recipeId, boolean main) {
    return new RecipeMedia(
        recipeId, userId, "object-key-" + UUID.randomUUID(), "foto.png", "image/png", 7, main);
  }
}
