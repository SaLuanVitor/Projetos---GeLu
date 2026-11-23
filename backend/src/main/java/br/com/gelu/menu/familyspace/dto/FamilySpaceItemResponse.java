package br.com.gelu.menu.familyspace.dto;

import br.com.gelu.menu.familyspace.FamilySpaceItem;
import java.time.format.DateTimeFormatter;

public record FamilySpaceItemResponse(
    String id,
    String familyId,
    String authorId,
    String authorName,
    String category,
    String title,
    String description,
    String highlightTag,
    boolean pinned,
    int orderIndex,
    String createdAt,
    String updatedAt) {

  public static FamilySpaceItemResponse from(FamilySpaceItem item) {
    return new FamilySpaceItemResponse(
        item.getId().toString(),
        item.getFamily().getId().toString(),
        item.getAuthor().getId().toString(),
        item.getAuthor().getName(),
        item.getCategory(),
        item.getTitle(),
        item.getDescription(),
        item.getHighlightTag(),
        item.isPinned(),
        item.getOrderIndex(),
        item.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        item.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
  }
}
