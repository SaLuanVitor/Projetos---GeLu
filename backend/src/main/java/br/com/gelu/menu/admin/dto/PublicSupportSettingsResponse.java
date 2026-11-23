package br.com.gelu.menu.admin.dto;

public record PublicSupportSettingsResponse(
    String supportEmail,
    String supportPhone,
    String supportWhatsapp,
    String supportHours,
    String systemBroadcastBanner) {}
