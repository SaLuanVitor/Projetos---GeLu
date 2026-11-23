package br.com.gelu.menu.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_usage_logs")
public class AiUsageLog {

  @Id private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "family_id")
  private UUID familyId;

  @Column(name = "operation_type", nullable = false, length = 50)
  private String operationType;

  @Column(name = "model_name", nullable = false, length = 50)
  private String modelName;

  @Column(name = "prompt_tokens")
  private int promptTokens;

  @Column(name = "completion_tokens")
  private int completionTokens;

  @Column(name = "total_tokens")
  private int totalTokens;

  @Column(name = "latency_ms")
  private long latencyMs;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  public AiUsageLog() {}

  public AiUsageLog(
      UUID userId,
      UUID familyId,
      String operationType,
      String modelName,
      int promptTokens,
      int completionTokens,
      int totalTokens,
      long latencyMs,
      String status) {
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.familyId = familyId;
    this.operationType = operationType;
    this.modelName = modelName;
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalTokens = totalTokens;
    this.latencyMs = latencyMs;
    this.status = status;
    this.createdAt = LocalDateTime.now();
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

  public String getOperationType() {
    return operationType;
  }

  public String getModelName() {
    return modelName;
  }

  public int getPromptTokens() {
    return promptTokens;
  }

  public int getCompletionTokens() {
    return completionTokens;
  }

  public int getTotalTokens() {
    return totalTokens;
  }

  public long getLatencyMs() {
    return latencyMs;
  }

  public String getStatus() {
    return status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
