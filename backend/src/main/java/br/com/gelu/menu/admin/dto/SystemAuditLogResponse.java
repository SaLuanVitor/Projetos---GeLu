package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SystemAuditLogResponse(
    UUID id,
    String actorEmail,
    String action,
    String details,
    String ipAddress,
    LocalDateTime createdAt) {}
