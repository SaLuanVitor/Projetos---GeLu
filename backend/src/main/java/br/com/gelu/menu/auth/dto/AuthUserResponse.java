package br.com.gelu.menu.auth.dto;

import br.com.gelu.menu.admin.AdminRole;
import java.util.UUID;

public record AuthUserResponse(
    UUID id,
    String name,
    String email,
    boolean active,
    boolean isSuperAdmin,
    AdminRole adminRole) {}
