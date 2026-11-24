package br.com.gelu.menu.meals;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "meal_logs")
public class MealLog implements Persistable<UUID> {

  @Id private UUID id;

  @Transient private boolean isNew = true;

  @Override
  public boolean isNew() {
    return isNew;
  }

  @PostLoad
  @PostPersist
  void markNotNew() {
    this.isNew = false;
  }

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "family_id")
  private UUID familyId;

  @Column(name = "meal_type", nullable = false, length = 30)
  private String mealType;

  @Column(name = "dish_name", nullable = false, length = 150)
  private String dishName;

  @Column(name = "photo_url", length = 500)
  private String photoUrl;

  @Column(name = "total_calories", nullable = false, precision = 8, scale = 2)
  private BigDecimal totalCalories;

  @Column(name = "proteins", nullable = false, precision = 8, scale = 2)
  private BigDecimal proteins;

  @Column(name = "carbohydrates", nullable = false, precision = 8, scale = 2)
  private BigDecimal carbohydrates;

  @Column(name = "fats", nullable = false, precision = 8, scale = 2)
  private BigDecimal fats;

  @Column(name = "fibers", precision = 8, scale = 2)
  private BigDecimal fibers;

  @Column(name = "sodium", precision = 8, scale = 2)
  private BigDecimal sodium;

  @Column(name = "items_json", columnDefinition = "TEXT")
  private String itemsJson;

  @Column(name = "ai_notes", columnDefinition = "TEXT")
  private String aiNotes;

  @Column(name = "diet_meal_id")
  private UUID dietMealId;

  @Column(name = "status", nullable = false, length = 30)
  private String status = "CUSTOM_CONSUMED";

  @Column(name = "input_method", nullable = false, length = 30)
  private String inputMethod = "MANUAL";

  @Column(name = "raw_input_text", columnDefinition = "TEXT")
  private String rawInputText;

  @Column(name = "skip_reason", length = 100)
  private String skipReason;

  @Column(name = "consumed_at", nullable = false)
  private LocalDateTime consumedAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected MealLog() {}

  public MealLog(
      UUID userId,
      UUID familyId,
      String mealType,
      String dishName,
      String photoUrl,
      BigDecimal totalCalories,
      BigDecimal proteins,
      BigDecimal carbohydrates,
      BigDecimal fats,
      BigDecimal fibers,
      BigDecimal sodium,
      String itemsJson,
      String aiNotes,
      LocalDateTime consumedAt) {
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.familyId = familyId;
    this.mealType = mealType;
    this.dishName = dishName;
    this.photoUrl = photoUrl;
    this.totalCalories = totalCalories != null ? totalCalories : BigDecimal.ZERO;
    this.proteins = proteins != null ? proteins : BigDecimal.ZERO;
    this.carbohydrates = carbohydrates != null ? carbohydrates : BigDecimal.ZERO;
    this.fats = fats != null ? fats : BigDecimal.ZERO;
    this.fibers = fibers != null ? fibers : BigDecimal.ZERO;
    this.sodium = sodium != null ? sodium : BigDecimal.ZERO;
    this.itemsJson = itemsJson;
    this.aiNotes = aiNotes;
    this.consumedAt = consumedAt != null ? consumedAt : LocalDateTime.now();
    this.createdAt = LocalDateTime.now();
  }

  public MealLog(
      UUID userId,
      UUID familyId,
      UUID dietMealId,
      String mealType,
      String dishName,
      String photoUrl,
      BigDecimal totalCalories,
      BigDecimal proteins,
      BigDecimal carbohydrates,
      BigDecimal fats,
      BigDecimal fibers,
      BigDecimal sodium,
      String itemsJson,
      String aiNotes,
      String status,
      String inputMethod,
      String rawInputText,
      String skipReason,
      LocalDateTime consumedAt) {
    this(
        userId,
        familyId,
        mealType,
        dishName,
        photoUrl,
        totalCalories,
        proteins,
        carbohydrates,
        fats,
        fibers,
        sodium,
        itemsJson,
        aiNotes,
        consumedAt);
    this.dietMealId = dietMealId;
    this.status = status != null ? status : "CUSTOM_CONSUMED";
    this.inputMethod = inputMethod != null ? inputMethod : "MANUAL";
    this.rawInputText = rawInputText;
    this.skipReason = skipReason;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getFamilyId() {
    return familyId;
  }

  public String getMealType() {
    return mealType;
  }

  public String getDishName() {
    return dishName;
  }

  public String getPhotoUrl() {
    return photoUrl;
  }

  public BigDecimal getTotalCalories() {
    return totalCalories;
  }

  public BigDecimal getProteins() {
    return proteins;
  }

  public BigDecimal getCarbohydrates() {
    return carbohydrates;
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

  public String getItemsJson() {
    return itemsJson;
  }

  public String getAiNotes() {
    return aiNotes;
  }

  public LocalDateTime getConsumedAt() {
    return consumedAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public UUID getDietMealId() {
    return dietMealId;
  }

  public String getStatus() {
    return status;
  }

  public String getInputMethod() {
    return inputMethod;
  }

  public String getRawInputText() {
    return rawInputText;
  }

  public String getSkipReason() {
    return skipReason;
  }
}
