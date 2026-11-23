package br.com.gelu.menu.admin.dto;

import br.com.gelu.menu.admin.AdminRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminTeamMemberResponse(
    UUID id,
    String name,
    String email,
    AdminRole role,
    boolean active,
    LocalDateTime createdAt,
    boolean isMasterSuperAdmin,
    boolean isSelf) {}
