package br.com.gelu.menu.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

  List<AuditLog> findAllByFamilyIdOrderByCreatedAtDesc(UUID familyId);

  List<AuditLog> findAllByFamilyIdInOrderByCreatedAtDesc(List<UUID> familyIds);

  List<AuditLog> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

  List<AuditLog> findTop100ByOrderByCreatedAtDesc();

  List<AuditLog> findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(
      String entityType, String entityId);
}
