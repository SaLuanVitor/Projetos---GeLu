package br.com.gelu.menu.admin.dto;

import br.com.gelu.menu.admin.AdminRole;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminRoleRequest(
    @NotNull(message = "Perfil de acesso é obrigatório") AdminRole role) {}
