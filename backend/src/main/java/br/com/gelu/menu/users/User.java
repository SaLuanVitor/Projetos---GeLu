package br.com.gelu.menu.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

  @Id private UUID id;

  @Column(nullable = false, length = 150)
  private String name;

  @Column(nullable = false, unique = true, length = 180)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "birth_date")
  private LocalDate birthDate;

  @Column(name = "height_cm")
  private BigDecimal heightCm;

  @Column(name = "current_weight")
  private BigDecimal currentWeight;

  @Column(name = "biological_sex", length = 20)
  private String biologicalSex;

  @Column(length = 80)
  private String goal;

  @Column(name = "basal_calories")
  private BigDecimal basalCalories;

  @Column(name = "daily_calorie_goal")
  private BigDecimal dailyCalorieGoal;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected User() {}

  public User(String name, String email, String passwordHash) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.active = true;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void updatePasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
    this.updatedAt = LocalDateTime.now();
  }

  public void updateProfile(
      String name,
      LocalDate birthDate,
      BigDecimal heightCm,
      String biologicalSex,
      String goal,
      BigDecimal basalCalories,
      BigDecimal dailyCalorieGoal) {
    this.name = name;
    this.birthDate = birthDate;
    this.heightCm = heightCm;
    this.biologicalSex = biologicalSex;
    this.goal = goal;
    this.basalCalories = basalCalories;
    this.dailyCalorieGoal = dailyCalorieGoal;
    this.updatedAt = LocalDateTime.now();
  }

  public void updateCurrentWeight(BigDecimal currentWeight) {
    this.currentWeight = currentWeight;
    this.updatedAt = LocalDateTime.now();
  }

  public boolean isActive() {
    return active;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public BigDecimal getHeightCm() {
    return heightCm;
  }

  public BigDecimal getCurrentWeight() {
    return currentWeight;
  }

  public String getBiologicalSex() {
    return biologicalSex;
  }

  public String getGoal() {
    return goal;
  }

  public BigDecimal getBasalCalories() {
    return basalCalories;
  }

  public BigDecimal getDailyCalorieGoal() {
    return dailyCalorieGoal;
  }
}
