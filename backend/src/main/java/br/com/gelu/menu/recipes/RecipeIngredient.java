package br.com.gelu.menu.recipes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "recipe_ingredients")
public class RecipeIngredient {

  @Id private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "recipe_id", nullable = false)
  private Recipe recipe;

  @Column(nullable = false)
  private Integer position;

  @Column(nullable = false, length = 150)
  private String name;

  @Column(length = 80)
  private String quantity;

  @Column(length = 40)
  private String unit;

  protected RecipeIngredient() {}

  public RecipeIngredient(Integer position, String name, String quantity, String unit) {
    this.id = UUID.randomUUID();
    this.position = position;
    this.name = name;
    this.quantity = quantity;
    this.unit = unit;
  }

  void attachTo(Recipe recipe) {
    this.recipe = recipe;
  }

  public UUID getId() {
    return id;
  }

  public Integer getPosition() {
    return position;
  }

  public String getName() {
    return name;
  }

  public String getQuantity() {
    return quantity;
  }

  public String getUnit() {
    return unit;
  }
}
