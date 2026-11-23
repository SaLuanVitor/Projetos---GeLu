package br.com.gelu.menu.schedule;

import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "schedule_completions")
public class ScheduleCompletion {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "activity_id", nullable = false)
  private ScheduleActivity activity;

  @Column(name = "completion_date", nullable = false)
  private LocalDate completionDate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "completed_by", nullable = false)
  private User completedBy;

  @Column(name = "completed_at", nullable = false)
  private LocalDateTime completedAt;

  protected ScheduleCompletion() {}

  public ScheduleCompletion(ScheduleActivity activity, LocalDate completionDate, User completedBy) {
    this.id = UUID.randomUUID();
    this.activity = activity;
    this.completionDate = completionDate;
    this.completedBy = completedBy;
    this.completedAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public ScheduleActivity getActivity() {
    return activity;
  }

  public LocalDate getCompletionDate() {
    return completionDate;
  }

  public User getCompletedBy() {
    return completedBy;
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }
}
