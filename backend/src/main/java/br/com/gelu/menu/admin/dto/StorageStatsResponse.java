package br.com.gelu.menu.admin.dto;

import java.util.List;

public record StorageStatsResponse(
    long totalSizeBytes,
    String totalSizeFormatted,
    int totalFiles,
    int mealPhotosCount,
    long mealPhotosBytes,
    int recipeMediaCount,
    long recipeMediaBytes,
    int otherFilesCount,
    long otherFilesBytes,
    int orphanFilesCount,
    long orphanFilesBytes,
    String orphanFilesFormatted,
    List<OrphanItemResponse> orphanFiles
) {}
