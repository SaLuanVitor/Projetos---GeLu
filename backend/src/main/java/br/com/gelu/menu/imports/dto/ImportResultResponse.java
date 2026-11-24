package br.com.gelu.menu.imports.dto;

import java.util.List;
import java.util.Map;

public record ImportResultResponse(
    boolean valid,
    int totalRows,
    int successRows,
    int errorCount,
    List<ImportValidationError> errors,
    List<Map<String, Object>> previewData,
    String summaryMessage
) {
  public static ImportResultResponse validPreview(
      int totalRows,
      List<Map<String, Object>> preview,
      String message
  ) {
    return new ImportResultResponse(true, totalRows, totalRows, 0, List.of(), preview, message);
  }

  public static ImportResultResponse withErrors(
      int totalRows,
      List<ImportValidationError> errors,
      String message
  ) {
    return new ImportResultResponse(false, totalRows, 0, errors.size(), errors, List.of(), message);
  }

  public static ImportResultResponse completed(
      int importedCount,
      String message
  ) {
    return new ImportResultResponse(true, importedCount, importedCount, 0, List.of(), List.of(), message);
  }
}
