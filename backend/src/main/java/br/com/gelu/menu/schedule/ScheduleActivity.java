package br.com.gelu.menu.schedule;

import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.recipes.Recipe;
import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "schedule_activities")
public class ScheduleActivity {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id")
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "day_of_week", nullable = false, length = 10)
  private String dayOfWeek;

  @Column(name = "start_time", nullable = false, length = 5)
  private String startTime;

  @Column(name = "end_time", nullable = false, length = 5)
  private String endTime;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(nullable = false, length = 30)
  private String category;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "goal_tag", length = 50)
  private String goalTag;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipe_id")
  private Recipe recipe;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_to_user_id")
  private User assignedTo;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(
      name = "schedule_activity_assignees",
      joinColumns = @JoinColumn(name = "activity_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  private Set<User> assignees = new HashSet<>();

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected ScheduleActivity() {}

  public ScheduleActivity(
      Family family,
      String dayOfWeek,
      String startTime,
      String endTime,
      String title,
      String category,
      String notes,
      String goalTag,
      Recipe recipe,
      User assignedTo,
      int orderIndex) {
    this(
        family,
        null,
        dayOfWeek,
        startTime,
        endTime,
        title,
        category,
        notes,
        goalTag,
        recipe,
        assignedTo,
        orderIndex);
  }

  public ScheduleActivity(
      Family family,
      User user,
      String dayOfWeek,
      String startTime,
      String endTime,
      String title,
      String category,
      String notes,
      String goalTag,
      Recipe recipe,
      User assignedTo,
      int orderIndex) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.family = family;
    this.user = user;
    this.dayOfWeek = dayOfWeek != null ? dayOfWeek.toUpperCase() : "SEG";
    this.startTime = startTime;
    this.endTime = endTime;
    this.title = title;
    this.category = (category != null && !category.isBlank()) ? category.toUpperCase() : "TRABALHO";
    this.notes = notes;
    this.goalTag = goalTag;
    this.recipe = recipe;
    this.assignedTo = assignedTo;
    this.orderIndex = orderIndex;
    this.createdAt = now;
    this.updatedAt = now;
    if (assignedTo != null) {
      this.assignees.add(assignedTo);
    }
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

  public String getDayOfWeek() {
    return dayOfWeek;
  }

  public String getStartTime() {
    return startTime;
  }

  public String getEndTime() {
    return endTime;
  }

  public String getTitle() {
    return title;
  }

  public String getCategory() {
    return category;
  }

  public String getNotes() {
    return notes;
  }

  public String getGoalTag() {
    return goalTag;
  }

  public Recipe getRecipe() {
    return recipe;
  }

  public User getAssignedTo() {
    if (assignedTo != null) {
      return assignedTo;
    }
    return (assignees != null && !assignees.isEmpty()) ? assignees.iterator().next() : null;
  }

  public Set<User> getAssignees() {
    return assignees;
  }

  public void setAssignees(Set<User> assignees) {
    this.assignees = assignees != null ? new HashSet<>(assignees) : new HashSet<>();
    if (!this.assignees.isEmpty()) {
      this.assignedTo = this.assignees.iterator().next();
    } else {
      this.assignedTo = null;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void update(
      String dayOfWeek,
      String startTime,
      String endTime,
      String title,
      String category,
      String notes,
      String goalTag,
      Recipe recipe,
      User assignedTo,
      int orderIndex) {
    this.dayOfWeek = dayOfWeek != null ? dayOfWeek.toUpperCase() : this.dayOfWeek;
    this.startTime = startTime;
    this.endTime = endTime;
    this.title = title;
    this.category =
        (category != null && !category.isBlank()) ? category.toUpperCase() : this.category;
    this.notes = notes;
    this.goalTag = goalTag;
    this.recipe = recipe;
    this.assignedTo = assignedTo;
    this.orderIndex = orderIndex;
    this.updatedAt = LocalDateTime.now();
  }
}
