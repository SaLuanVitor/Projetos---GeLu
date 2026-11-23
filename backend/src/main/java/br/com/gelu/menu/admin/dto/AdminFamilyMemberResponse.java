package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminFamilyMemberResponse(
    UUID id,
    UUID userId,
    String name,
    String email,
    String role,
    LocalDateTime joinedAt) {}
