package br.com.gelu.menu.recipes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeMediaRepository extends JpaRepository<RecipeMedia, UUID> {

  List<RecipeMedia> findByRecipeIdAndUserIdOrderByCreatedAtAsc(UUID recipeId, UUID userId);

  Optional<RecipeMedia> findByIdAndRecipeIdAndUserId(UUID id, UUID recipeId, UUID userId);

  boolean existsByRecipeIdAndUserId(UUID recipeId, UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = false)
  @Query(
      """
      update RecipeMedia media
      set media.main = false
      where media.recipeId = :recipeId
        and media.userId = :userId
        and media.main = true
      """)
  int clearMainImages(@Param("recipeId") UUID recipeId, @Param("userId") UUID userId);
}
