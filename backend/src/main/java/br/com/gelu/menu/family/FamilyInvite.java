package br.com.gelu.menu.family;

import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "family_invites")
public class FamilyInvite {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "family_id", nullable = false)
  private Family family;

  @Column(name = "invited_email", nullable = false, length = 255)
  private String invitedEmail;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "invited_by_user_id", nullable = false)
  private User invitedBy;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, length = 30)
  private FamilyRole role;

  @Column(name = "token", nullable = false, unique = true, length = 100)
  private String token;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 30)
  private FamilyInviteStatus status;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public FamilyInvite() {}

  public FamilyInvite(
      Family family,
      String invitedEmail,
      User invitedBy,
      FamilyRole role,
      String token,
      Instant expiresAt) {
    this.family = family;
    this.invitedEmail = invitedEmail.trim().toLowerCase();
    this.invitedBy = invitedBy;
    this.role = role != null ? role : FamilyRole.VIEWER;
    this.token = token;
    this.status = FamilyInviteStatus.PENDING;
    this.expiresAt = expiresAt;
    this.createdAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public Family getFamily() {
    return family;
  }

  public String getInvitedEmail() {
    return invitedEmail;
  }

  public User getInvitedBy() {
    return invitedBy;
  }

  public FamilyRole getRole() {
    return role;
  }

  public String getToken() {
    return token;
  }

  public FamilyInviteStatus getStatus() {
    return status;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }

  public void accept() {
    this.status = FamilyInviteStatus.ACCEPTED;
    this.updatedAt = Instant.now();
  }

  public void reject() {
    this.status = FamilyInviteStatus.REJECTED;
    this.updatedAt = Instant.now();
  }

  public void cancel() {
    this.status = FamilyInviteStatus.CANCELED;
    this.updatedAt = Instant.now();
  }

  public void expire() {
    this.status = FamilyInviteStatus.EXPIRED;
    this.updatedAt = Instant.now();
  }
}
