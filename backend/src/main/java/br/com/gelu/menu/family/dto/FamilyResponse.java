package br.com.gelu.menu.family.dto;

import br.com.gelu.menu.family.Family;
import java.time.format.DateTimeFormatter;
import java.util.List;

public record FamilyResponse(
    String id,
    String name,
    String ownerId,
    List<FamilyMemberResponse> members,
    String createdAt,
    String updatedAt) {

  public static FamilyResponse from(Family family) {
    return new FamilyResponse(
        family.getId().toString(),
        family.getName(),
        family.getOwnerId().toString(),
        family.getMembers().stream().map(FamilyMemberResponse::from).toList(),
        family.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        family.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
  }
}
