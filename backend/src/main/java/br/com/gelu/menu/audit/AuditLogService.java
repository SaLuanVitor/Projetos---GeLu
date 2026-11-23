package br.com.gelu.menu.audit;

import br.com.gelu.menu.audit.dto.AuditLogResponse;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

  private final AuditLogRepository auditLogRepository;
  private final FamilyRepository familyRepository;

  public AuditLogService(AuditLogRepository auditLogRepository, FamilyRepository familyRepository) {
    this.auditLogRepository = auditLogRepository;
    this.familyRepository = familyRepository;
  }

  @Transactional(propagation = Propagation.REQUIRED)
  public void log(
      AuditAction action,
      String entityType,
      String entityId,
      UUID familyId,
      UUID userId,
      String userName,
      String details) {
    AuditLog log =
        new AuditLog(
            entityType,
            entityId,
            familyId,
            action,
            userId,
            userName != null ? userName : "Usuário",
            details);
    auditLogRepository.save(log);
  }

  @Transactional(readOnly = true)
  public List<AuditLogResponse> listByFamily(UUID familyId) {
    return auditLogRepository.findAllByFamilyIdOrderByCreatedAtDesc(familyId).stream()
        .map(AuditLogResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AuditLogResponse> listSystemAuditLogs(UUID userId) {
    List<UUID> familyIds =
        familyRepository.findAllByMemberUserId(userId).stream().map(Family::getId).toList();

    if (familyIds.isEmpty()) {
      return auditLogRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
          .map(AuditLogResponse::from)
          .toList();
    }

    return auditLogRepository.findAllByFamilyIdInOrderByCreatedAtDesc(familyIds).stream()
        .map(AuditLogResponse::from)
        .toList();
  }
}
