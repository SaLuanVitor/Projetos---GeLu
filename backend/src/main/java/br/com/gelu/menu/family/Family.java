package br.com.gelu.menu.family;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "families")
public class Family {

  @Id private UUID id;

  @Column(nullable = false, length = 150)
  private String name;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @OneToMany(mappedBy = "family", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("joinedAt ASC")
  private List<FamilyMember> members = new ArrayList<>();

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected Family() {}

  public Family(String name, UUID ownerId) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.name = name;
    this.ownerId = ownerId;
    this.createdAt = now;
    this.updatedAt = now;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void updateName(String name) {
    this.name = name;
    this.updatedAt = LocalDateTime.now();
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public List<FamilyMember> getMembers() {
    return members;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void addMember(FamilyMember member) {
    this.members.add(member);
    this.updatedAt = LocalDateTime.now();
  }

  public void removeMember(UUID userId) {
    this.members.removeIf(m -> m.getUserId().equals(userId));
    this.updatedAt = LocalDateTime.now();
  }
}
