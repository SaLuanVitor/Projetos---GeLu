package br.com.gelu.menu.recipes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeMediaRepository extends JpaRepository<RecipeMedia, UUID> {

  List<RecipeMedia> findByRecipeIdAndUserIdOrderByCreatedAtAsc(UUID recipeId, UUID userId);

  Optional<RecipeMedia> findByIdAndRecipeIdAndUserId(UUID id, UUID recipeId, UUID userId);

  boolean existsByRecipeIdAndUserId(UUID recipeId, UUID userId);
}
