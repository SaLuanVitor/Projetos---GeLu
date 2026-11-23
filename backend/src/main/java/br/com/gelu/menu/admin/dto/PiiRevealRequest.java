package br.com.gelu.menu.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PiiRevealRequest(
    @NotNull(message = "ID do usuário é obrigatório") UUID targetUserId,
    @NotBlank(message = "Justificativa obrigatória (mínimo 5 caracteres)") String reason) {}
