package br.com.gelu.menu.recipes;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.media.ObjectStorageService;
import br.com.gelu.menu.media.StorageProperties;
import br.com.gelu.menu.media.StoredFile;
import br.com.gelu.menu.recipes.dto.RecipeMediaResponse;
import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class RecipeMediaService {

  private static final Set<String> ALLOWED_IMAGE_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp");

  private final RecipeRepository recipeRepository;
  private final RecipeMediaRepository recipeMediaRepository;
  private final ObjectStorageService objectStorageService;
  private final StorageProperties storageProperties;

  public RecipeMediaService(
      RecipeRepository recipeRepository,
      RecipeMediaRepository recipeMediaRepository,
      ObjectStorageService objectStorageService,
      StorageProperties storageProperties) {
    this.recipeRepository = recipeRepository;
    this.recipeMediaRepository = recipeMediaRepository;
    this.objectStorageService = objectStorageService;
    this.storageProperties = storageProperties;
  }

  @Transactional(readOnly = true)
  public List<RecipeMediaResponse> listMedia(UUID userId, UUID recipeId) {
    ensureOwnedRecipe(userId, recipeId);
    return responses(
        recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId));
  }

  @Transactional
  public RecipeMediaResponse uploadMedia(UUID userId, UUID recipeId, MultipartFile file) {
    ensureOwnedRecipe(userId, recipeId);
    validateFile(file);
    boolean firstImage = !recipeMediaRepository.existsByRecipeIdAndUserId(recipeId, userId);
    String contentType = file.getContentType();
    String fileName = sanitizeFileName(file.getOriginalFilename());
    String objectKey =
        "recipes/%s/%s/%s-%s".formatted(userId, recipeId, UUID.randomUUID(), fileName);

    try {
      objectStorageService.put(objectKey, file.getInputStream(), file.getSize(), contentType);
    } catch (IOException exception) {
      throw new BadRequestException("Could not upload image");
    }

    RecipeMedia media =
        new RecipeMedia(
            recipeId, userId, objectKey, fileName, contentType, file.getSize(), firstImage);
    return toResponse(recipeMediaRepository.save(media));
  }

  @Transactional
  public RecipeMediaResponse setMain(UUID userId, UUID recipeId, UUID mediaId) {
    ensureOwnedRecipe(userId, recipeId);
    RecipeMedia selected = findOwnedMedia(userId, recipeId, mediaId);
    recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId).stream()
        .filter(RecipeMedia::isMain)
        .forEach(RecipeMedia::clearMain);
    selected.markAsMain();
    return toResponse(selected);
  }

  @Transactional
  public void deleteMedia(UUID userId, UUID recipeId, UUID mediaId) {
    ensureOwnedRecipe(userId, recipeId);
    RecipeMedia media = findOwnedMedia(userId, recipeId, mediaId);
    boolean wasMain = media.isMain();
    recipeMediaRepository.delete(media);
    objectStorageService.remove(media.getObjectKey());

    if (wasMain) {
      recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId).stream()
          .findFirst()
          .ifPresent(RecipeMedia::markAsMain);
    }
  }

  @Transactional(readOnly = true)
  public StoredFile getContent(UUID userId, UUID recipeId, UUID mediaId) {
    ensureOwnedRecipe(userId, recipeId);
    RecipeMedia media = findOwnedMedia(userId, recipeId, mediaId);
    return objectStorageService.get(
        media.getObjectKey(), media.getContentType(), media.getSizeBytes());
  }

  @Transactional
  public void deleteStorageForRecipe(UUID userId, UUID recipeId) {
    recipeMediaRepository.findByRecipeIdAndUserIdOrderByCreatedAtAsc(recipeId, userId).stream()
        .map(RecipeMedia::getObjectKey)
        .forEach(objectStorageService::remove);
  }

  public List<RecipeMediaResponse> responses(List<RecipeMedia> media) {
    return media.stream().map(this::toResponse).toList();
  }

  private RecipeMedia findOwnedMedia(UUID userId, UUID recipeId, UUID mediaId) {
    return recipeMediaRepository
        .findByIdAndRecipeIdAndUserId(mediaId, recipeId, userId)
        .orElseThrow(() -> new NotFoundException("Recipe image not found"));
  }

  private void ensureOwnedRecipe(UUID userId, UUID recipeId) {
    recipeRepository
        .findByIdAndUserId(recipeId, userId)
        .orElseThrow(() -> new NotFoundException("Recipe not found"));
  }

  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Image is required");
    }
    if (file.getSize() > storageProperties.maxImageSizeBytes()) {
      throw new BadRequestException("Image is too large");
    }
    if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
      throw new BadRequestException("Unsupported image type");
    }
  }

  private RecipeMediaResponse toResponse(RecipeMedia media) {
    return new RecipeMediaResponse(
        media.getId(),
        media.getFileName(),
        media.getContentType(),
        media.getSizeBytes(),
        media.isMain(),
        "%s/%s/media/%s/content"
            .formatted(storageProperties.proxyBasePath(), media.getRecipeId(), media.getId()),
        media.getCreatedAt());
  }

  private String sanitizeFileName(String originalFileName) {
    String fallback = "recipe-image";
    String value =
        originalFileName == null || originalFileName.isBlank() ? fallback : originalFileName;
    String normalized = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    String sanitized = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]+", "-");
    sanitized = sanitized.replaceAll("-+", "-").replaceAll("^-|-$", "");
    return sanitized.isBlank() ? fallback : sanitized;
  }
}
