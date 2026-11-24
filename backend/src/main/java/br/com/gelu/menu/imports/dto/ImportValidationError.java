package br.com.gelu.menu.imports.dto;

public record ImportValidationError(
    int rowNumber,
    String sheetName,
    String column,
    String message,
    String valueProvided
) {}
