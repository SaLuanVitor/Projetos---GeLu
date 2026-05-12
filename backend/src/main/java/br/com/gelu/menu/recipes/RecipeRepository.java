package br.com.gelu.menu.recipes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

  Optional<Recipe> findByIdAndUserId(UUID id, UUID userId);

  @Query(
      """
      select distinct recipe
      from Recipe recipe
      left join recipe.ingredients ingredient
      where recipe.userId = :userId
        and (:query is null or lower(recipe.name) like lower(concat('%', :query, '%'))
          or lower(coalesce(recipe.description, '')) like lower(concat('%', :query, '%')))
        and (:ingredient is null or lower(ingredient.name) like lower(concat('%', :ingredient, '%')))
        and (:category is null or lower(recipe.category) = lower(:category))
        and (:maxPrepTimeMinutes is null or recipe.prepTimeMinutes <= :maxPrepTimeMinutes)
        and (:maxCalories is null or recipe.estimatedCalories <= :maxCalories)
      order by recipe.createdAt desc
      """)
  List<Recipe> search(
      @Param("userId") UUID userId,
      @Param("query") String query,
      @Param("ingredient") String ingredient,
      @Param("category") String category,
      @Param("maxPrepTimeMinutes") Integer maxPrepTimeMinutes,
      @Param("maxCalories") BigDecimal maxCalories);
}
