package br.com.gelu.menu.recipes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recipes")
public class Recipe {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(length = 180, unique = true)
  private String slug;

  @Column(nullable = false, length = 150)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 80)
  private String category;

  @Column(name = "prep_time_minutes")
  private Integer prepTimeMinutes;

  @Column(name = "estimated_calories")
  private BigDecimal estimatedCalories;

  private BigDecimal carbohydrates;
  private BigDecimal proteins;
  private BigDecimal fats;
  private BigDecimal fibers;
  private BigDecimal sodium;

  private Integer servings;

  @Column(name = "video_url", length = 500)
  private String videoUrl;

  @Column(nullable = false)
  private boolean favorite;

  @Enumerated(EnumType.STRING)
  @Column(name = "main_media_type", nullable = false, length = 20)
  private RecipeMainMediaType mainMediaType = RecipeMainMediaType.IMAGE;

  @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("position ASC")
  private List<RecipeIngredient> ingredients = new ArrayList<>();

  @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("position ASC")
  private List<RecipeStep> steps = new ArrayList<>();

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected Recipe() {}

  public Recipe(
      UUID userId,
      String name,
      String description,
      String category,
      Integer prepTimeMinutes,
      BigDecimal estimatedCalories,
      Integer servings,
      String videoUrl) {
    this(userId, null, name, description, category, prepTimeMinutes, estimatedCalories, servings, videoUrl, null, null, null, null, null);
  }

  public Recipe(
      UUID userId,
      String slug,
      String name,
      String description,
      String category,
      Integer prepTimeMinutes,
      BigDecimal estimatedCalories,
      Integer servings,
      String videoUrl,
      BigDecimal carbohydrates,
      BigDecimal proteins,
      BigDecimal fats,
      BigDecimal fibers,
      BigDecimal sodium) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.slug = slug;
    this.name = name;
    this.description = description;
    this.category = category;
    this.prepTimeMinutes = prepTimeMinutes;
    this.estimatedCalories = estimatedCalories;
    this.servings = servings;
    this.videoUrl = videoUrl;
    this.carbohydrates = carbohydrates;
    this.proteins = proteins;
    this.fats = fats;
    this.fibers = fibers;
    this.sodium = sodium;
    this.favorite = false;
    this.mainMediaType = RecipeMainMediaType.IMAGE;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public void update(
      String name,
      String description,
      String category,
      Integer prepTimeMinutes,
      BigDecimal estimatedCalories,
      Integer servings,
      String videoUrl) {
    update(name, description, category, prepTimeMinutes, estimatedCalories, servings, videoUrl, this.carbohydrates, this.proteins, this.fats, this.fibers, this.sodium);
  }

  public void update(
      String name,
      String description,
      String category,
      Integer prepTimeMinutes,
      BigDecimal estimatedCalories,
      Integer servings,
      String videoUrl,
      BigDecimal carbohydrates,
      BigDecimal proteins,
      BigDecimal fats,
      BigDecimal fibers,
      BigDecimal sodium) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.prepTimeMinutes = prepTimeMinutes;
    this.estimatedCalories = estimatedCalories;
    this.servings = servings;
    this.videoUrl = videoUrl;
    this.carbohydrates = carbohydrates;
    this.proteins = proteins;
    this.fats = fats;
    this.fibers = fibers;
    this.sodium = sodium;
    if (videoUrl == null && mainMediaType == RecipeMainMediaType.VIDEO) {
      this.mainMediaType = RecipeMainMediaType.IMAGE;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void setSlug(String slug) {
    this.slug = slug;
    this.updatedAt = LocalDateTime.now();
  }

  public void setFavorite(boolean favorite) {
    this.favorite = favorite;
    this.updatedAt = LocalDateTime.now();
  }

  public void setMainMediaType(RecipeMainMediaType mainMediaType) {
    this.mainMediaType = mainMediaType;
    this.updatedAt = LocalDateTime.now();
  }

  public void replaceIngredients(List<RecipeIngredient> newIngredients) {
    ingredients.clear();
    newIngredients.stream()
        .sorted(Comparator.comparingInt(RecipeIngredient::getPosition))
        .forEach(
            ingredient -> {
              ingredient.attachTo(this);
              ingredients.add(ingredient);
            });
  }

  public void replaceSteps(List<RecipeStep> newSteps) {
    steps.clear();
    newSteps.stream()
        .sorted(Comparator.comparingInt(RecipeStep::getPosition))
        .forEach(
            step -> {
              step.attachTo(this);
              steps.add(step);
            });
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getSlug() {
    return slug;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public String getCategory() {
    return category;
  }

  public Integer getPrepTimeMinutes() {
    return prepTimeMinutes;
  }

  public BigDecimal getEstimatedCalories() {
    return estimatedCalories;
  }

  public BigDecimal getCarbohydrates() {
    return carbohydrates;
  }

  public BigDecimal getProteins() {
    return proteins;
  }

  public BigDecimal getFats() {
    return fats;
  }

  public BigDecimal getFibers() {
    return fibers;
  }

  public BigDecimal getSodium() {
    return sodium;
  }

  public Integer getServings() {
    return servings;
  }

  public String getVideoUrl() {
    return videoUrl;
  }

  public boolean isFavorite() {
    return favorite;
  }

  public RecipeMainMediaType getMainMediaType() {
    return mainMediaType;
  }

  public List<RecipeIngredient> getIngredients() {
    return ingredients;
  }

  public List<RecipeStep> getSteps() {
    return steps;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }
}
