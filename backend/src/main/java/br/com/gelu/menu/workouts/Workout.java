package br.com.gelu.menu.workouts;

import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workouts")
public class Workout {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id")
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "category", nullable = false, length = 50)
  private String category;

  @Column(name = "calories_per_hour", nullable = false)
  private int caloriesPerHour;

  @Column(name = "default_duration_minutes", nullable = false)
  private int defaultDurationMinutes;

  @Column(name = "notes", columnDefinition = "TEXT")
  private String notes;

  @Column(name = "days_of_week", length = 100)
  private String daysOfWeek;

  @Column(name = "exercises_json", columnDefinition = "TEXT")
  private String exercisesJson;

  @Column(name = "favorite", nullable = false)
  private boolean favorite = false;

  @Column(name = "intensity", nullable = false, length = 30)
  private String intensity = "MODERADO";

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public Workout() {}

  public Workout(
      Family family,
      User user,
      String title,
      String category,
      int caloriesPerHour,
      int defaultDurationMinutes,
      String notes) {
    this(family, user, title, category, caloriesPerHour, defaultDurationMinutes, notes, null, null, false, "MODERADO");
  }

  public Workout(
      Family family,
      User user,
      String title,
      String category,
      int caloriesPerHour,
      int defaultDurationMinutes,
      String notes,
      String daysOfWeek,
      String exercisesJson,
      boolean favorite,
      String intensity) {
    this.family = family;
    this.user = user;
    this.title = title.trim();
    this.category = category != null ? category.trim().toUpperCase() : "MUSCULACAO";
    this.caloriesPerHour = caloriesPerHour > 0 ? caloriesPerHour : 400;
    this.defaultDurationMinutes = defaultDurationMinutes > 0 ? defaultDurationMinutes : 60;
    this.notes = notes;
    this.daysOfWeek = daysOfWeek;
    this.exercisesJson = exercisesJson;
    this.favorite = favorite;
    this.intensity = intensity != null ? intensity.trim().toUpperCase() : "MODERADO";
    this.createdAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public Family getFamily() {
    return family;
  }

  public User getUser() {
    return user;
  }

  public String getTitle() {
    return title;
  }

  public String getCategory() {
    return category;
  }

  public int getCaloriesPerHour() {
    return caloriesPerHour;
  }

  public int getDefaultDurationMinutes() {
    return defaultDurationMinutes;
  }

  public String getNotes() {
    return notes;
  }

  public String getDaysOfWeek() {
    return daysOfWeek;
  }

  public String getExercisesJson() {
    return exercisesJson;
  }

  public boolean isFavorite() {
    return favorite;
  }

  public String getIntensity() {
    return intensity;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void update(
      String title,
      String category,
      int caloriesPerHour,
      int defaultDurationMinutes,
      String notes,
      String daysOfWeek,
      String exercisesJson,
      Boolean favorite,
      String intensity) {
    this.title = title.trim();
    this.category = category != null ? category.trim().toUpperCase() : this.category;
    this.caloriesPerHour = caloriesPerHour > 0 ? caloriesPerHour : this.caloriesPerHour;
    this.defaultDurationMinutes =
        defaultDurationMinutes > 0 ? defaultDurationMinutes : this.defaultDurationMinutes;
    this.notes = notes;
    this.daysOfWeek = daysOfWeek;
    this.exercisesJson = exercisesJson;
    if (favorite != null) this.favorite = favorite;
    if (intensity != null && !intensity.isBlank()) this.intensity = intensity.trim().toUpperCase();
    this.updatedAt = Instant.now();
  }

  public void update(
      String title,
      String category,
      int caloriesPerHour,
      int defaultDurationMinutes,
      String notes) {
    update(title, category, caloriesPerHour, defaultDurationMinutes, notes, this.daysOfWeek, this.exercisesJson, this.favorite, this.intensity);
  }
}
