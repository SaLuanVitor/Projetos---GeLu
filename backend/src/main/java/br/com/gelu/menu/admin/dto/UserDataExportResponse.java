package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UserDataExportResponse(
    UUID userId,
    String name,
    String email,
    LocalDateTime createdAt,
    boolean active,
    List<String> families,
    long totalRecipesCreated,
    long totalDietsCreated,
    long totalWorkoutsLogged,
    long totalAiRequests,
    LocalDateTime exportedAt,
    String lgpdDisclaimer) {}
