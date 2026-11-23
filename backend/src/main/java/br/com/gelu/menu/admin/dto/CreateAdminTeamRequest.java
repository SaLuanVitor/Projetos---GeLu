package br.com.gelu.menu.admin.dto;

import br.com.gelu.menu.admin.AdminRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAdminTeamRequest(
    @NotBlank(message = "Nome é obrigatório") String name,
    @NotBlank(message = "E-mail é obrigatório") @Email(message = "E-mail inválido") String email,
    @NotBlank(message = "Senha provisória é obrigatória")
        @Size(min = 6, message = "Senha mínima de 6 caracteres")
        String password,
    @NotNull(message = "Perfil de acesso é obrigatório") AdminRole role) {}
