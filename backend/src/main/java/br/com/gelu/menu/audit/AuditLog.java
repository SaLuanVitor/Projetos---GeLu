package br.com.gelu.menu.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

  @Id private UUID id;

  @Column(name = "entity_type", nullable = false, length = 50)
  private String entityType;

  @Column(name = "entity_id", nullable = false, length = 100)
  private String entityId;

  @Column(name = "family_id")
  private UUID familyId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private AuditAction action;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "user_name", nullable = false, length = 150)
  private String userName;

  @Column(columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected AuditLog() {}

  public AuditLog(
      String entityType,
      String entityId,
      UUID familyId,
      AuditAction action,
      UUID userId,
      String userName,
      String details) {
    this.id = UUID.randomUUID();
    this.entityType = entityType;
    this.entityId = entityId;
    this.familyId = familyId;
    this.action = action;
    this.userId = userId;
    this.userName = userName;
    this.details = details;
    this.createdAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public String getEntityType() {
    return entityType;
  }

  public String getEntityId() {
    return entityId;
  }

  public UUID getFamilyId() {
    return familyId;
  }

  public AuditAction getAction() {
    return action;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getUserName() {
    return userName;
  }

  public String getDetails() {
    return details;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
