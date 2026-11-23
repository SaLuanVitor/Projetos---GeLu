package br.com.gelu.menu.family;

import br.com.gelu.menu.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "family_members")
public class FamilyMember {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id", nullable = false)
  private Family family;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private FamilyRole role;

  @Column(name = "joined_at", nullable = false)
  private LocalDateTime joinedAt;

  protected FamilyMember() {}

  public FamilyMember(Family family, User user, FamilyRole role) {
    this.id = UUID.randomUUID();
    this.family = family;
    this.user = user;
    this.role = role != null ? role : FamilyRole.VIEWER;
    this.joinedAt = LocalDateTime.now();
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

  public UUID getUserId() {
    return user != null ? user.getId() : null;
  }

  public FamilyRole getRole() {
    return role;
  }

  public void updateRole(FamilyRole role) {
    this.role = role;
  }

  public LocalDateTime getJoinedAt() {
    return joinedAt;
  }
}
