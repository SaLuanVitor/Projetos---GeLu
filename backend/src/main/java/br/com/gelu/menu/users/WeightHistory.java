package br.com.gelu.menu.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "weight_history")
public class WeightHistory {

  @Id private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "weight_kg", nullable = false)
  private BigDecimal weightKg;

  @Column(name = "recorded_at", nullable = false)
  private LocalDateTime recordedAt;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected WeightHistory() {}

  public WeightHistory(UUID userId, BigDecimal weightKg, LocalDateTime recordedAt) {
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.weightKg = weightKg;
    this.recordedAt = recordedAt;
    this.createdAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public BigDecimal getWeightKg() {
    return weightKg;
  }

  public LocalDateTime getRecordedAt() {
    return recordedAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
