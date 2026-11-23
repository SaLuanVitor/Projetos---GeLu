package br.com.gelu.menu.couplenotes.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateCoupleNoteRequest(
    UUID familyId,
    @NotBlank(message = "Content is required") String content,
    String category,
    String color,
    Boolean pinned,
    UUID recipientUserId) {}
