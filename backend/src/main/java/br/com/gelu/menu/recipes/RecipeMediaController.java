package br.com.gelu.menu.recipes;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.media.StoredFile;
import br.com.gelu.menu.recipes.dto.RecipeMediaResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/recipes/{recipeId}/media")
public class RecipeMediaController {

  private final RecipeMediaService recipeMediaService;

  public RecipeMediaController(RecipeMediaService recipeMediaService) {
    this.recipeMediaService = recipeMediaService;
  }

  @GetMapping
  public ApiResponse<List<RecipeMediaResponse>> listMedia(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID recipeId) {
    return ApiResponse.ok(
        recipeMediaService.listMedia(user.id(), recipeId), "Recipe images loaded successfully");
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<RecipeMediaResponse> uploadMedia(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID recipeId,
      @RequestParam("file") MultipartFile file) {
    return ApiResponse.ok(
        recipeMediaService.uploadMedia(user.id(), recipeId, file), "Image uploaded");
  }

  @PutMapping("/{mediaId}/main")
  public ApiResponse<RecipeMediaResponse> setMain(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID recipeId,
      @PathVariable UUID mediaId) {
    return ApiResponse.ok(
        recipeMediaService.setMain(user.id(), recipeId, mediaId), "Main image updated");
  }

  @DeleteMapping("/{mediaId}")
  public ApiResponse<Void> deleteMedia(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID recipeId,
      @PathVariable UUID mediaId) {
    recipeMediaService.deleteMedia(user.id(), recipeId, mediaId);
    return ApiResponse.ok(null, "Image deleted");
  }

  @GetMapping("/{mediaId}/content")
  public ResponseEntity<InputStreamResource> getContent(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID recipeId,
      @PathVariable UUID mediaId) {
    StoredFile file = recipeMediaService.getContent(user.id(), recipeId, mediaId);
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(file.sizeBytes()))
        .contentType(MediaType.parseMediaType(file.contentType()))
        .body(new InputStreamResource(file.content()));
  }
}
