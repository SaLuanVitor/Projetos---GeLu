package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;

public record SystemSettingResponse(
    String key, String value, LocalDateTime updatedAt, String updatedBy) {}
