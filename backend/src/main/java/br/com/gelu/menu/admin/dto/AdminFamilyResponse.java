package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminFamilyResponse(
    UUID id,
    String name,
    UUID ownerId,
    String ownerName,
    String ownerEmail,
    int membersCount,
    LocalDateTime createdAt,
    List<AdminFamilyMemberResponse> members) {}
