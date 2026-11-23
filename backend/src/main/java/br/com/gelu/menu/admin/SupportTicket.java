package br.com.gelu.menu.admin;

import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "support_tickets")
public class SupportTicket {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "subject", nullable = false, length = 200)
  private String subject;

  @Column(name = "category", nullable = false, length = 50)
  private String category;

  @Column(name = "description", nullable = false, columnDefinition = "TEXT")
  private String description;

  @Column(name = "status", nullable = false, length = 30)
  private String status;

  @Column(name = "admin_notes", columnDefinition = "TEXT")
  private String adminNotes;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public SupportTicket() {}

  public SupportTicket(User user, String subject, String category, String description) {
    this.user = user;
    this.subject = subject.trim();
    this.category = category != null ? category.trim().toUpperCase() : "DUVIDA";
    this.description = description.trim();
    this.status = "OPEN";
    this.createdAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public String getSubject() {
    return subject;
  }

  public String getCategory() {
    return category;
  }

  public String getDescription() {
    return description;
  }

  public String getStatus() {
    return status;
  }

  public String getAdminNotes() {
    return adminNotes;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void updateStatus(String status, String adminNotes) {
    if (status != null && !status.isBlank()) {
      this.status = status.trim().toUpperCase();
    }
    if (adminNotes != null) {
      this.adminNotes = adminNotes.trim();
    }
    this.updatedAt = Instant.now();
  }
}
