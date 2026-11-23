package br.com.gelu.menu.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_audit_logs")
public class SystemAuditLog {

  @Id private UUID id;

  @Column(name = "actor_email", nullable = false)
  private String actorEmail;

  @Column(nullable = false, length = 100)
  private String action;

  @Column(columnDefinition = "TEXT")
  private String details;

  @Column(name = "ip_address", length = 50)
  private String ipAddress;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  public SystemAuditLog() {}

  public SystemAuditLog(String actorEmail, String action, String details, String ipAddress) {
    this.id = UUID.randomUUID();
    this.actorEmail = actorEmail;
    this.action = action;
    this.details = details;
    this.ipAddress = ipAddress;
    this.createdAt = LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public String getActorEmail() {
    return actorEmail;
  }

  public String getAction() {
    return action;
  }

  public String getDetails() {
    return details;
  }

  public String getIpAddress() {
    return ipAddress;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
