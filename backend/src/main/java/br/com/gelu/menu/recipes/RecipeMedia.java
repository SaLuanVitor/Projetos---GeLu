package br.com.gelu.menu.recipes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recipe_media")
public class RecipeMedia {

  @Id private UUID id;

  @Column(name = "recipe_id", nullable = false)
  private UUID recipeId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "object_key", nullable = false, length = 700)
  private String objectKey;

  @Column(name = "file_name", nullable = false)
  private String fileName;

  @Column(name = "content_type", nullable = false, length = 80)
  private String contentType;

  @Column(name = "size_bytes", nullable = false)
  private long sizeBytes;

  @Column(name = "is_main", nullable = false)
  private boolean main;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected RecipeMedia() {}

  public RecipeMedia(
      UUID recipeId,
      UUID userId,
      String objectKey,
      String fileName,
      String contentType,
      long sizeBytes,
      boolean main) {
    this.id = UUID.randomUUID();
    this.recipeId = recipeId;
    this.userId = userId;
    this.objectKey = objectKey;
    this.fileName = fileName;
    this.contentType = contentType;
    this.sizeBytes = sizeBytes;
    this.main = main;
    this.createdAt = LocalDateTime.now();
  }

  public void markAsMain() {
    this.main = true;
  }

  public void clearMain() {
    this.main = false;
  }

  public UUID getId() {
    return id;
  }

  public UUID getRecipeId() {
    return recipeId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getObjectKey() {
    return objectKey;
  }

  public String getFileName() {
    return fileName;
  }

  public String getContentType() {
    return contentType;
  }

  public long getSizeBytes() {
    return sizeBytes;
  }

  public boolean isMain() {
    return main;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
