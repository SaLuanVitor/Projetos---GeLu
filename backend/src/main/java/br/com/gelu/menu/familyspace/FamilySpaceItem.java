package br.com.gelu.menu.familyspace;

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
@Table(name = "family_space_items")
public class FamilySpaceItem {

  @Id private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_id", nullable = false)
  private Family family;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @Column(nullable = false, length = 30)
  private String category; // 'ROTINA', 'ALIMENTACAO', 'BEM_ESTAR', 'FINANCAS', 'CONTATOS'

  @Column(nullable = false, length = 150)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "highlight_tag", length = 50)
  private String highlightTag;

  @Column(nullable = false)
  private boolean pinned;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected FamilySpaceItem() {}

  public FamilySpaceItem(
      Family family,
      User author,
      String category,
      String title,
      String description,
      String highlightTag,
      boolean pinned,
      int orderIndex) {
    LocalDateTime now = LocalDateTime.now();
    this.id = UUID.randomUUID();
    this.family = family;
    this.author = author;
    this.category = (category != null && !category.isBlank()) ? category.toUpperCase() : "ROTINA";
    this.title = title;
    this.description = description;
    this.highlightTag = highlightTag;
    this.pinned = pinned;
    this.orderIndex = orderIndex;
    this.createdAt = now;
    this.updatedAt = now;
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

  public String getCategory() {
    return category;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public String getHighlightTag() {
    return highlightTag;
  }

  public boolean isPinned() {
    return pinned;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void update(
      String category,
      String title,
      String description,
      String highlightTag,
      boolean pinned,
      int orderIndex) {
    if (category != null && !category.isBlank()) this.category = category.toUpperCase();
    this.title = title;
    this.description = description;
    this.highlightTag = highlightTag;
    this.pinned = pinned;
    this.orderIndex = orderIndex;
    this.updatedAt = LocalDateTime.now();
  }
}
