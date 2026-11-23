package br.com.gelu.menu.schedule;

import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "family_weekly_goals")
public class FamilyWeeklyGoal {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id")
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(name = "goal_tag", nullable = false, length = 50)
  private String goalTag;

  @Column(name = "target_count", nullable = false)
  private int targetCount;

  @Column(nullable = false, length = 30)
  private String unit;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected FamilyWeeklyGoal() {}

  public FamilyWeeklyGoal(
      Family family, String title, String goalTag, int targetCount, String unit) {
    this(family, null, title, goalTag, targetCount, unit);
  }

  public FamilyWeeklyGoal(
      Family family, User user, String title, String goalTag, int targetCount, String unit) {
    this.id = UUID.randomUUID();
    this.family = family;
    this.user = user;
    this.title = title;
    this.goalTag = goalTag;
    this.targetCount = targetCount > 0 ? targetCount : 1;
    this.unit = unit != null && !unit.isBlank() ? unit : "vezes";
    this.createdAt = LocalDateTime.now();
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

  public String getGoalTag() {
    return goalTag;
  }

  public int getTargetCount() {
    return targetCount;
  }

  public String getUnit() {
    return unit;
  }

  public void update(String title, String goalTag, int targetCount, String unit) {
    this.title = title;
    this.goalTag = goalTag;
    this.targetCount = targetCount > 0 ? targetCount : 1;
    this.unit = unit != null && !unit.isBlank() ? unit : this.unit;
  }
}
