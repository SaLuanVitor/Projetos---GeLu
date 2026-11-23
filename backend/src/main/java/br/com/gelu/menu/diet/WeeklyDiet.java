package br.com.gelu.menu.diet;

import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.users.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "weekly_diets")
public class WeeklyDiet {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id")
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(name = "week_start", nullable = false)
  private LocalDate weekStart;

  @Column(name = "week_end", nullable = false)
  private LocalDate weekEnd;

  @OneToMany(mappedBy = "diet", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("orderIndex ASC, mealTime ASC, createdAt ASC")
  private List<DietMeal> meals = new ArrayList<>();

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected WeeklyDiet() {}

  public WeeklyDiet(Family family, User user, String title, LocalDate weekStart, LocalDate weekEnd) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.family = family;
    this.user = user;
    this.title = title;
    this.weekStart = weekStart;
    this.weekEnd = weekEnd;
    this.createdAt = now;
    this.updatedAt = now;
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

  public void setTitle(String title) {
    this.title = title;
    this.updatedAt = LocalDateTime.now();
  }

  public LocalDate getWeekStart() {
    return weekStart;
  }

  public LocalDate getWeekEnd() {
    return weekEnd;
  }

  public List<DietMeal> getMeals() {
    return meals;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void addMeal(DietMeal meal) {
    this.meals.add(meal);
    this.updatedAt = LocalDateTime.now();
  }

  public void removeMeal(DietMeal meal) {
    this.meals.remove(meal);
    this.updatedAt = LocalDateTime.now();
  }
}
