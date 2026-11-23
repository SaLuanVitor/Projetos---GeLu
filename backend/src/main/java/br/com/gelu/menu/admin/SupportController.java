package br.com.gelu.menu.admin;

import br.com.gelu.menu.admin.dto.CreateSupportTicketRequest;
import br.com.gelu.menu.admin.dto.PublicSupportSettingsResponse;
import br.com.gelu.menu.admin.dto.SupportTicketResponse;
import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/support")
public class SupportController {

  private final SupportService supportService;

  public SupportController(SupportService supportService) {
    this.supportService = supportService;
  }

  @GetMapping("/settings")
  public ApiResponse<PublicSupportSettingsResponse> getPublicSettings() {
    return ApiResponse.ok(supportService.getPublicSettings(), "Public support settings loaded");
  }

  @GetMapping("/my-tickets")
  public ApiResponse<List<SupportTicketResponse>> getMyTickets(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(supportService.getMyTickets(user.id()), "My support tickets loaded");
  }

  @PostMapping("/tickets")
  public ApiResponse<SupportTicketResponse> createTicket(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateSupportTicketRequest request) {
    return ApiResponse.ok(
        supportService.createTicket(user.id(), request), "Support ticket opened successfully");
  }
}
