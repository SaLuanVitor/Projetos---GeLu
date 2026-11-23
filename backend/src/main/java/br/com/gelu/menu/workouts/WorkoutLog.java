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
@Table(name = "workout_logs")
public class WorkoutLog {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id")
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workout_id")
  private Workout workout;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "category", nullable = false, length = 50)
  private String category;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Column(name = "calories_burned", nullable = false)
  private int caloriesBurned;

  @Column(name = "performed_at", nullable = false)
  private Instant performedAt;

  @Column(name = "notes", columnDefinition = "TEXT")
  private String notes;

  @Column(name = "completed", nullable = false)
  private boolean completed;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public WorkoutLog() {}

  public WorkoutLog(
      Family family,
      User user,
      Workout workout,
      String title,
      String category,
      int durationMinutes,
      int caloriesBurned,
      Instant performedAt,
      String notes) {
    this.family = family;
    this.user = user;
    this.workout = workout;
    this.title = title.trim();
    this.category = category != null ? category.trim().toUpperCase() : "MUSCULACAO";
    this.durationMinutes = durationMinutes > 0 ? durationMinutes : 60;
    this.caloriesBurned = caloriesBurned > 0 ? caloriesBurned : 300;
    this.performedAt = performedAt != null ? performedAt : Instant.now();
    this.notes = notes;
    this.completed = true;
    this.createdAt = Instant.now();
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

  public Workout getWorkout() {
    return workout;
  }

  public String getTitle() {
    return title;
  }

  public String getCategory() {
    return category;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public int getCaloriesBurned() {
    return caloriesBurned;
  }

  public Instant getPerformedAt() {
    return performedAt;
  }

  public String getNotes() {
    return notes;
  }

  public boolean isCompleted() {
    return completed;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
