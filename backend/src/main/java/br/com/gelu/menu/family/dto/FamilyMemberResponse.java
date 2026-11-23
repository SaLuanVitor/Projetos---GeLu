package br.com.gelu.menu.family.dto;

import br.com.gelu.menu.family.FamilyMember;
import java.time.format.DateTimeFormatter;

public record FamilyMemberResponse(
    String id, String userId, String userName, String userEmail, String role, String joinedAt) {

  public static FamilyMemberResponse from(FamilyMember member) {
    return new FamilyMemberResponse(
        member.getId().toString(),
        member.getUser().getId().toString(),
        member.getUser().getName(),
        member.getUser().getEmail(),
        member.getRole().name(),
        member.getJoinedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
  }
}
