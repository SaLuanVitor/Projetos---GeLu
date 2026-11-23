package br.com.gelu.menu.couplenotes.dto;

import br.com.gelu.menu.couplenotes.CoupleNote;
import java.time.format.DateTimeFormatter;

public record CoupleNoteResponse(
    String id,
    String familyId,
    String authorId,
    String authorName,
    String recipientUserId,
    String recipientUserName,
    String content,
    String category,
    String color,
    boolean pinned,
    String acknowledgedAt,
    String acknowledgedByName,
    boolean resolved,
    String createdAt) {

  public CoupleNoteResponse(
      String id,
      String familyId,
      String authorId,
      String authorName,
      String content,
      String category,
      String color,
      boolean pinned,
      String acknowledgedAt,
      String acknowledgedByName,
      boolean resolved,
      String createdAt) {
    this(
        id,
        familyId,
        authorId,
        authorName,
        null,
        null,
        content,
        category,
        color,
        pinned,
        acknowledgedAt,
        acknowledgedByName,
        resolved,
        createdAt);
  }

  public static CoupleNoteResponse from(CoupleNote note) {
    return new CoupleNoteResponse(
        note.getId().toString(),
        note.getFamily().getId().toString(),
        note.getAuthor().getId().toString(),
        note.getAuthor().getName(),
        note.getRecipient() != null ? note.getRecipient().getId().toString() : null,
        note.getRecipient() != null ? note.getRecipient().getName() : null,
        note.getContent(),
        note.getCategory(),
        note.getColor(),
        note.isPinned(),
        note.getAcknowledgedAt() != null
            ? note.getAcknowledgedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            : null,
        note.getAcknowledgedBy() != null ? note.getAcknowledgedBy().getName() : null,
        note.isResolved(),
        note.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
  }
}
