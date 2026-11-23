package br.com.gelu.menu.couplenotes;

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
@Table(name = "couple_notes")
public class CoupleNote {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id", nullable = false)
  private Family family;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "recipient_user_id")
  private User recipient;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(nullable = false, length = 30)
  private String category;

  @Column(nullable = false, length = 30)
  private String color;

  @Column(nullable = false)
  private boolean pinned;

  @Column(name = "acknowledged_at")
  private LocalDateTime acknowledgedAt;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "acknowledged_by")
  private User acknowledgedBy;

  @Column(nullable = false)
  private boolean resolved;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected CoupleNote() {}

  public CoupleNote(
      Family family, User author, User recipient, String content, String category, String color, boolean pinned) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.family = family;
    this.author = author;
    this.recipient = recipient;
    this.content = content;
    this.category = (category != null && !category.isBlank()) ? category.toUpperCase() : "RECADO";
    this.color = (color != null && !color.isBlank()) ? color.toLowerCase() : "yellow";
    this.pinned = pinned;
    this.resolved = false;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public CoupleNote(
      Family family, User author, String content, String category, String color, boolean pinned) {
    this(family, author, null, content, category, color, pinned);
  }

  public User getRecipient() {
    return recipient;
  }

  public void setRecipient(User recipient) {
    this.recipient = recipient;
  }

  public UUID getId() {
    return id;
  }

  public Family getFamily() {
    return family;
  }

  public User getAuthor() {
    return author;
  }

  public String getContent() {
    return content;
  }

  public void updateContent(String content, String category, String color, boolean pinned) {
    this.content = content;
    if (category != null && !category.isBlank()) this.category = category.toUpperCase();
    if (color != null && !color.isBlank()) this.color = color.toLowerCase();
    this.pinned = pinned;
    this.updatedAt = LocalDateTime.now();
  }

  public String getCategory() {
    return category;
  }

  public String getColor() {
    return color;
  }

  public boolean isPinned() {
    return pinned;
  }

  public LocalDateTime getAcknowledgedAt() {
    return acknowledgedAt;
  }

  public User getAcknowledgedBy() {
    return acknowledgedBy;
  }

  public boolean isResolved() {
    return resolved;
  }

  public void acknowledge(User user) {
    this.acknowledgedBy = user;
    this.acknowledgedAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public void resolve(boolean resolved) {
    this.resolved = resolved;
    this.updatedAt = LocalDateTime.now();
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }
}
