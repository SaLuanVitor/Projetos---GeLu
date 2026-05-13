package br.com.gelu.menu.recipes.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RecipeMediaResponse(
    UUID id,
    String fileName,
    String contentType,
    long sizeBytes,
    boolean main,
    String url,
    LocalDateTime createdAt) {}
