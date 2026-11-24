package br.com.gelu.menu.recipes;

import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFavoriteRecipeRepository
    extends JpaRepository<UserFavoriteRecipe, UserFavoriteRecipe.UserFavoriteRecipeId> {

  boolean existsByIdUserIdAndIdRecipeId(UUID userId, UUID recipeId);

  @Query("SELECT f.id.recipeId FROM UserFavoriteRecipe f WHERE f.id.userId = :userId")
  Set<UUID> findFavoriteRecipeIdsByUserId(@Param("userId") UUID userId);

  @Modifying
  @Query(
      "DELETE FROM UserFavoriteRecipe f WHERE f.id.userId = :userId AND f.id.recipeId = :recipeId")
  void deleteByUserIdAndRecipeId(@Param("userId") UUID userId, @Param("recipeId") UUID recipeId);
}
