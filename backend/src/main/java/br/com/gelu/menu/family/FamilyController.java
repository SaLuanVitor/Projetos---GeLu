package br.com.gelu.menu.family;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.family.dto.AddFamilyMemberRequest;
import br.com.gelu.menu.family.dto.CreateFamilyInviteRequest;
import br.com.gelu.menu.family.dto.CreateFamilyRequest;
import br.com.gelu.menu.family.dto.FamilyInviteResponse;
import br.com.gelu.menu.family.dto.FamilyResponse;
import br.com.gelu.menu.family.dto.FamilyWeightHistoryResponse;
import br.com.gelu.menu.family.dto.UpdateFamilyRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/families")
public class FamilyController {

  private final FamilyService familyService;

  public FamilyController(FamilyService familyService) {
    this.familyService = familyService;
  }

  @GetMapping
  public ApiResponse<List<FamilyResponse>> listFamilies(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(familyService.listFamilies(user.id()), "Families loaded successfully");
  }

  @GetMapping("/{id}")
  public ApiResponse<FamilyResponse> getFamily(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return ApiResponse.ok(familyService.getFamily(user.id(), id), "Family loaded successfully");
  }

  @PostMapping
  public ApiResponse<FamilyResponse> createFamily(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateFamilyRequest request) {
    return ApiResponse.ok(
        familyService.createFamily(user.id(), request), "Family created successfully");
  }

  @PutMapping("/{id}")
  public ApiResponse<FamilyResponse> updateFamily(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateFamilyRequest request) {
    return ApiResponse.ok(
        familyService.updateFamily(user.id(), id, request), "Family updated successfully");
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteFamily(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    familyService.deleteFamily(user.id(), id);
    return ApiResponse.ok(null, "Family deleted successfully");
  }

  @PostMapping("/{familyId}/members")
  public ApiResponse<FamilyResponse> addFamilyMember(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID familyId,
      @Valid @RequestBody AddFamilyMemberRequest request) {
    return ApiResponse.ok(
        familyService.addFamilyMember(user.id(), familyId, request), "Member added successfully");
  }

  @DeleteMapping("/{familyId}/members/{userId}")
  public ApiResponse<FamilyResponse> removeFamilyMember(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID familyId,
      @PathVariable String userId) {
    return ApiResponse.ok(
        familyService.removeFamilyMember(user.id(), familyId, userId),
        "Member removed successfully");
  }

  @PostMapping("/{familyId}/invites")
  public ApiResponse<FamilyInviteResponse> createInvite(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID familyId,
      @Valid @RequestBody CreateFamilyInviteRequest request) {
    return ApiResponse.ok(
        familyService.createInvite(user.id(), familyId, request), "Invite created successfully");
  }

  @GetMapping("/{familyId}/invites")
  public ApiResponse<List<FamilyInviteResponse>> listPendingInvites(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID familyId) {
    return ApiResponse.ok(
        familyService.listPendingInvites(user.id(), familyId), "Invites loaded successfully");
  }

  @DeleteMapping("/{familyId}/invites/{inviteId}")
  public ApiResponse<Void> cancelInvite(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID familyId,
      @PathVariable UUID inviteId) {
    familyService.cancelInvite(user.id(), familyId, inviteId);
    return ApiResponse.ok(null, "Invite canceled successfully");
  }

  @GetMapping("/{familyId}/weight-history")
  public ApiResponse<FamilyWeightHistoryResponse> getFamilyWeightHistory(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID familyId) {
    return ApiResponse.ok(
        familyService.getFamilyWeightHistory(user.id(), familyId),
        "Family weight history loaded successfully");
  }
}
