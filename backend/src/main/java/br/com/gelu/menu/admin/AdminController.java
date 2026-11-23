package br.com.gelu.menu.admin;

import br.com.gelu.menu.admin.dto.AdminFamilyResponse;
import br.com.gelu.menu.admin.dto.AdminMetricsResponse;
import br.com.gelu.menu.admin.dto.AdminTeamMemberResponse;
import br.com.gelu.menu.admin.dto.AdminUserResponse;
import br.com.gelu.menu.admin.dto.AiUsageSummaryResponse;
import br.com.gelu.menu.admin.dto.CreateAdminTeamRequest;
import br.com.gelu.menu.admin.dto.PiiRevealRequest;
import br.com.gelu.menu.admin.dto.SupportTicketResponse;
import br.com.gelu.menu.admin.dto.SystemAuditLogResponse;
import br.com.gelu.menu.admin.dto.SystemSettingResponse;
import br.com.gelu.menu.admin.dto.TestGeminiRequest;
import br.com.gelu.menu.admin.dto.TestGeminiResponse;
import br.com.gelu.menu.admin.dto.UpdateAdminRoleRequest;
import br.com.gelu.menu.admin.dto.UpdateAdminStatusRequest;
import br.com.gelu.menu.admin.dto.UpdateSupportTicketStatusRequest;
import br.com.gelu.menu.admin.dto.UpdateSystemSettingsRequest;
import br.com.gelu.menu.admin.dto.UserAiUsageResponse;
import br.com.gelu.menu.admin.dto.UserDataExportResponse;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

  private final AdminService adminService;

  public AdminController(AdminService adminService) {
    this.adminService = adminService;
  }

  @GetMapping("/metrics")
  public ApiResponse<AdminMetricsResponse> getMetrics(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(adminService.getMetrics(user.id()), "Admin metrics loaded successfully");
  }

  @GetMapping("/users")
  public ApiResponse<List<AdminUserResponse>> listUsers(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(adminService.listUsers(user.id()), "Admin users loaded successfully");
  }

  @GetMapping("/families")
  public ApiResponse<List<AdminFamilyResponse>> listFamilies(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        adminService.listFamilies(user.id()), "Admin families loaded successfully");
  }

  @GetMapping("/tickets")
  public ApiResponse<List<SupportTicketResponse>> listTickets(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) String status) {
    return ApiResponse.ok(
        adminService.listTickets(user.id(), status), "Support tickets loaded successfully");
  }

  @PutMapping("/tickets/{id}/status")
  public ApiResponse<SupportTicketResponse> updateTicketStatus(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestBody UpdateSupportTicketStatusRequest request) {
    return ApiResponse.ok(
        adminService.updateTicketStatus(user.id(), id, request),
        "Ticket status updated successfully");
  }

  @GetMapping("/settings")
  public ApiResponse<List<SystemSettingResponse>> getSettings(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        adminService.getSettings(user.id()), "System settings loaded successfully");
  }

  @PutMapping("/settings")
  public ApiResponse<Void> updateSettings(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody UpdateSystemSettingsRequest request) {
    adminService.updateSettings(user.id(), request);
    return ApiResponse.ok(null, "System settings updated successfully");
  }

  @GetMapping("/ai/usage")
  public ApiResponse<AiUsageSummaryResponse> getAiUsage(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        adminService.getAiUsageSummary(user.id()), "AI usage summary loaded successfully");
  }

  @PostMapping("/ai/test")
  public ApiResponse<TestGeminiResponse> testAiConnection(
      @AuthenticationPrincipal AuthenticatedUser user, @RequestBody TestGeminiRequest request) {
    return ApiResponse.ok(
        adminService.testGeminiConnection(user.id(), request), "AI test executed");
  }

  @GetMapping("/audit-logs")
  public ApiResponse<List<SystemAuditLogResponse>> getAuditLogs(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        adminService.getSystemAuditLogs(user.id()), "System audit logs loaded successfully");
  }

  @GetMapping("/ai/usage/by-user")
  public ApiResponse<List<UserAiUsageResponse>> getUserAiUsage(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        adminService.getUserAiUsage(user.id()), "User AI usage logs loaded successfully");
  }

  @GetMapping("/users/{id}/export")
  public ApiResponse<UserDataExportResponse> exportUserData(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return ApiResponse.ok(
        adminService.exportUserData(user.id(), id), "User data exported successfully");
  }

  @PutMapping("/users/{id}/anonymize")
  public ApiResponse<Void> anonymizeUser(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    adminService.anonymizeUser(user.id(), id);
    return ApiResponse.ok(null, "User anonymized successfully in compliance with LGPD");
  }

  @PostMapping("/audit/log-reveal")
  public ApiResponse<Void> logPiiReveal(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody(required = false) Map<String, String> body) {
    String details = body != null ? body.get("details") : null;
    adminService.logPiiReveal(user.id(), details);
    return ApiResponse.ok(null, "LGPD PII reveal logged successfully");
  }

  @PostMapping("/audit/pii-reveal")
  public ApiResponse<Void> logPiiRevealWithReason(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody PiiRevealRequest request) {
    adminService.logPiiRevealWithReason(user.id(), request);
    return ApiResponse.ok(null, "LGPD PII reveal logged with justification successfully");
  }

  @GetMapping("/team")
  public ApiResponse<List<AdminTeamMemberResponse>> listTeam(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(adminService.listTeam(user.id()), "Team members loaded successfully");
  }

  @PostMapping("/team")
  public ApiResponse<AdminTeamMemberResponse> createTeamMember(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateAdminTeamRequest request) {
    return ApiResponse.ok(
        adminService.createTeamMember(user.id(), request), "Team member created successfully");
  }

  @PatchMapping("/team/{id}/role")
  public ApiResponse<AdminTeamMemberResponse> updateTeamMemberRole(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateAdminRoleRequest request) {
    return ApiResponse.ok(
        adminService.updateTeamMemberRole(user.id(), id, request),
        "Team member role updated successfully");
  }

  @PatchMapping("/team/{id}/status")
  public ApiResponse<AdminTeamMemberResponse> updateTeamMemberStatus(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestBody UpdateAdminStatusRequest request) {
    return ApiResponse.ok(
        adminService.updateTeamMemberStatus(user.id(), id, request),
        "Team member status updated successfully");
  }

  @DeleteMapping("/team/{id}")
  public ApiResponse<Void> deleteTeamMember(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    adminService.deleteTeamMember(user.id(), id);
    return ApiResponse.ok(null, "Team member deleted successfully");
  }
}
