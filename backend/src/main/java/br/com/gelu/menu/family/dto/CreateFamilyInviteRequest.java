package br.com.gelu.menu.family.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateFamilyInviteRequest(
    @NotBlank(message = "O e-mail é obrigatório") @Email(message = "E-mail inválido")
        String invitedEmail,
    String role) {}
