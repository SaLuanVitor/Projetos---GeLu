package br.com.gelu.menu.admin.dto;

import br.com.gelu.menu.admin.SupportTicket;
import java.time.Instant;
import java.util.UUID;

public record SupportTicketResponse(
    UUID id,
    UUID userId,
    String userName,
    String userEmail,
    String subject,
    String category,
    String description,
    String status,
    String adminNotes,
    Instant createdAt,
    Instant updatedAt) {
  public static SupportTicketResponse from(SupportTicket t) {
    return new SupportTicketResponse(
        t.getId(),
        t.getUser().getId(),
        t.getUser().getName(),
        t.getUser().getEmail(),
        t.getSubject(),
        t.getCategory(),
        t.getDescription(),
        t.getStatus(),
        t.getAdminNotes(),
        t.getCreatedAt(),
        t.getUpdatedAt());
  }
}
