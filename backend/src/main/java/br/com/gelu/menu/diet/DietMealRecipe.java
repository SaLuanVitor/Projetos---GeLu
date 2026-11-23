package br.com.gelu.menu.diet;

import br.com.gelu.menu.recipes.Recipe;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "diet_meal_recipes")
public class DietMealRecipe implements Persistable<UUID> {

  @Id private UUID id;

  @Transient
  private boolean isNew = true;

  @Override
  public boolean isNew() {
    return isNew;
  }

  @PostLoad
  @PostPersist
  void markNotNew() {
    this.isNew = false;
  }

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "diet_meal_id", nullable = false)
  private DietMeal dietMeal;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "recipe_id", nullable = false)
  private Recipe recipe;

  @Column(nullable = false, precision = 8, scale = 2)
  private BigDecimal servings = BigDecimal.ONE;

  protected DietMealRecipe() {}

  public DietMealRecipe(DietMeal dietMeal, Recipe recipe, BigDecimal servings) {
    this.id = UUID.randomUUID();
    this.dietMeal = dietMeal;
    this.recipe = recipe;
    this.servings = servings != null ? servings : BigDecimal.ONE;
  }

  public UUID getId() {
    return id;
  }

  public DietMeal getDietMeal() {
    return dietMeal;
  }

  public Recipe getRecipe() {
    return recipe;
  }

  public BigDecimal getServings() {
    return servings;
  }

  public void setServings(BigDecimal servings) {
    this.servings = servings != null ? servings : BigDecimal.ONE;
  }
}
