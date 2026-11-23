package br.com.gelu.menu.audit.dto;

import br.com.gelu.menu.audit.AuditLog;
import java.time.format.DateTimeFormatter;

public record AuditLogResponse(
    String id,
    String entityType,
    String entityId,
    String familyId,
    String action,
    String userId,
    String userName,
    String details,
    String createdAt) {

  public static AuditLogResponse from(AuditLog log) {
    return new AuditLogResponse(
        log.getId().toString(),
        log.getEntityType(),
        log.getEntityId(),
        log.getFamilyId() != null ? log.getFamilyId().toString() : null,
        log.getAction().name(),
        log.getUserId().toString(),
        log.getUserName(),
        log.getDetails(),
        log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
  }
}
