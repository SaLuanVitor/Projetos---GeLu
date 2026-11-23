package br.com.gelu.menu.family.dto;

import br.com.gelu.menu.users.dto.WeightHistoryItem;
import java.math.BigDecimal;
import java.util.List;

public record FamilyMemberEvolutionDto(
    String userId,
    String userName,
    String userEmail,
    BigDecimal currentWeight,
    String role,
    List<WeightHistoryItem> history) {}
