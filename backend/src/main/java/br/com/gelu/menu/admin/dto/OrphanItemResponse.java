package br.com.gelu.menu.admin.dto;

public record OrphanItemResponse(
    String objectKey,
    long sizeBytes,
    String sizeFormatted,
    String lastModified
) {}
