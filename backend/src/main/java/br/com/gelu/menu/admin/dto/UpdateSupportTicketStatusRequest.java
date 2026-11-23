package br.com.gelu.menu.admin.dto;

public record UpdateSupportTicketStatusRequest(
    String status,
    String adminNotes
) {}
