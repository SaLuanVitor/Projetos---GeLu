package br.com.gelu.menu.recipes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "recipe_steps")
public class RecipeStep {

  @Id private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "recipe_id", nullable = false)
  private Recipe recipe;

  @Column(nullable = false)
  private Integer position;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String instruction;

  protected RecipeStep() {}

  public RecipeStep(Integer position, String instruction) {
    this.id = UUID.randomUUID();
    this.position = position;
    this.instruction = instruction;
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

  public String getInstruction() {
    return instruction;
  }
}
