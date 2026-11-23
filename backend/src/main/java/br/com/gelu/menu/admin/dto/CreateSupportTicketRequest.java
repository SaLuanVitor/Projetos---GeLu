package br.com.gelu.menu.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSupportTicketRequest(
    @NotBlank(message = "O assunto é obrigatório")
    String subject,
    String category,
    @NotBlank(message = "A descrição é obrigatória")
    String description
) {}
