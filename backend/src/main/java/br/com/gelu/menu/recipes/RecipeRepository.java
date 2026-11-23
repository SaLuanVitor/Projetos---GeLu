package br.com.gelu.menu.recipes;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RecipeRepository
    extends JpaRepository<Recipe, UUID>, JpaSpecificationExecutor<Recipe> {

  Optional<Recipe> findByIdAndUserId(UUID id, UUID userId);

  Optional<Recipe> findBySlug(String slug);

  Optional<Recipe> findBySlugAndUserId(String slug, UUID userId);
}
