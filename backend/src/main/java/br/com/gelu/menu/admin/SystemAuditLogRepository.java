package br.com.gelu.menu.admin;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, UUID> {
  List<SystemAuditLog> findTop50ByOrderByCreatedAtDesc();
}
