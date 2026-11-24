package br.com.gelu.menu.recipes;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_favorite_recipes")
public class UserFavoriteRecipe {

  @EmbeddedId
  private UserFavoriteRecipeId id;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  public UserFavoriteRecipe() {}

  public UserFavoriteRecipe(UUID userId, UUID recipeId) {
    this.id = new UserFavoriteRecipeId(userId, recipeId);
    this.createdAt = LocalDateTime.now();
  }

  public UserFavoriteRecipeId getId() {
    return id;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  @Embeddable
  public static class UserFavoriteRecipeId implements Serializable {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "recipe_id", nullable = false)
    private UUID recipeId;

    public UserFavoriteRecipeId() {}

    public UserFavoriteRecipeId(UUID userId, UUID recipeId) {
      this.userId = userId;
      this.recipeId = recipeId;
    }

    public UUID getUserId() {
      return userId;
    }

    public UUID getRecipeId() {
      return recipeId;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      UserFavoriteRecipeId that = (UserFavoriteRecipeId) o;
      return Objects.equals(userId, that.userId) && Objects.equals(recipeId, that.recipeId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, recipeId);
    }
  }
}
