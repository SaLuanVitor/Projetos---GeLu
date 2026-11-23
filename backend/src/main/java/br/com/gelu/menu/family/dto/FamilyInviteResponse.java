package br.com.gelu.menu.family.dto;

import br.com.gelu.menu.family.FamilyInvite;
import java.time.Instant;
import java.util.UUID;

public record FamilyInviteResponse(
    UUID id,
    UUID familyId,
    String familyName,
    String invitedEmail,
    UUID invitedByUserId,
    String invitedByUserName,
    String role,
    String token,
    String status,
    boolean expired,
    Instant expiresAt,
    Instant createdAt) {
  public static FamilyInviteResponse from(FamilyInvite invite) {
    return new FamilyInviteResponse(
        invite.getId(),
        invite.getFamily().getId(),
        invite.getFamily().getName(),
        invite.getInvitedEmail(),
        invite.getInvitedBy().getId(),
        invite.getInvitedBy().getName(),
        invite.getRole().name(),
        invite.getToken(),
        invite.getStatus().name(),
        invite.isExpired(),
        invite.getExpiresAt(),
        invite.getCreatedAt());
  }
}
