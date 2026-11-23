package br.com.gelu.menu.family.dto;

import java.util.List;

public record FamilyWeightHistoryResponse(
    String familyId,
    String familyName,
    List<FamilyMemberEvolutionDto> members
) {}
