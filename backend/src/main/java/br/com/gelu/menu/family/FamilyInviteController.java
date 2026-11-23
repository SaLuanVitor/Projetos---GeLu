package br.com.gelu.menu.family;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.family.dto.FamilyInviteResponse;
import br.com.gelu.menu.family.dto.FamilyResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invites")
public class FamilyInviteController {

  private final FamilyService familyService;

  public FamilyInviteController(FamilyService familyService) {
    this.familyService = familyService;
  }

  @GetMapping("/{token}")
  public ApiResponse<FamilyInviteResponse> getInvite(@PathVariable String token) {
    return ApiResponse.ok(familyService.getInviteByToken(token), "Invite loaded successfully");
  }

  @PostMapping("/{token}/accept")
  public ApiResponse<FamilyResponse> acceptInvite(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String token) {
    return ApiResponse.ok(
        familyService.acceptInvite(user.id(), token), "Invite accepted successfully");
  }

  @PostMapping("/{token}/reject")
  public ApiResponse<Void> rejectInvite(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable String token) {
    familyService.rejectInvite(user.id(), token);
    return ApiResponse.ok(null, "Invite rejected successfully");
  }
}
