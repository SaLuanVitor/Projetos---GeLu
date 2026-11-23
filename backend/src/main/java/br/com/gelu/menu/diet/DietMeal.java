package br.com.gelu.menu.diet;

import br.com.gelu.menu.users.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "diet_meals")
public class DietMeal implements Persistable<UUID> {

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
  @JoinColumn(name = "diet_id", nullable = false)
  private WeeklyDiet diet;

  @Column(name = "week_day", nullable = false, length = 20)
  private String weekDay;

  @Column(name = "meal_name", nullable = false, length = 80)
  private String mealName;

  @Column(name = "meal_time")
  private LocalTime mealTime;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "order_index", nullable = false)
  private int orderIndex = 0;

  @OneToMany(mappedBy = "dietMeal", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DietMealRecipe> recipes = new ArrayList<>();

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "diet_meal_people",
      joinColumns = @JoinColumn(name = "diet_meal_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  private Set<User> people = new HashSet<>();

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected DietMeal() {}

  public DietMeal(
      WeeklyDiet diet,
      String weekDay,
      String mealName,
      LocalTime mealTime,
      String notes,
      int orderIndex) {
    this.id = UUID.randomUUID();
    this.diet = diet;
    this.weekDay = weekDay;
    this.mealName = mealName;
    this.mealTime = mealTime;
    this.notes = notes;
    this.orderIndex = orderIndex;
    this.createdAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public WeeklyDiet getDiet() {
    return diet;
  }

  public String getWeekDay() {
    return weekDay;
  }

  public void setWeekDay(String weekDay) {
    this.weekDay = weekDay;
  }

  public String getMealName() {
    return mealName;
  }

  public void setMealName(String mealName) {
    this.mealName = mealName;
  }

  public LocalTime getMealTime() {
    return mealTime;
  }

  public void setMealTime(LocalTime mealTime) {
    this.mealTime = mealTime;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(int orderIndex) {
    this.orderIndex = orderIndex;
  }

  public List<DietMealRecipe> getRecipes() {
    return recipes;
  }

  public Set<User> getPeople() {
    return people;
  }

  public void setPeople(Set<User> people) {
    this.people = people != null ? people : new HashSet<>();
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
