package br.com.gelu.menu.audit;

import br.com.gelu.menu.audit.dto.AuditLogResponse;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.family.FamilyService;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AuditLogController {

  private final AuditLogService auditLogService;
  private final FamilyService familyService;

  public AuditLogController(AuditLogService auditLogService, FamilyService familyService) {
    this.auditLogService = auditLogService;
    this.familyService = familyService;
  }

  @GetMapping("/families/{familyId}/audit-logs")
  public ApiResponse<List<AuditLogResponse>> getFamilyAuditLogs(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID familyId) {
    familyService.getFamily(user.id(), familyId);
    return ApiResponse.ok(auditLogService.listByFamily(familyId), "Audit logs loaded successfully");
  }

  @GetMapping("/audit-logs")
  public ApiResponse<List<AuditLogResponse>> getSystemAuditLogs(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        auditLogService.listSystemAuditLogs(user.id()), "System audit logs loaded successfully");
  }
}
