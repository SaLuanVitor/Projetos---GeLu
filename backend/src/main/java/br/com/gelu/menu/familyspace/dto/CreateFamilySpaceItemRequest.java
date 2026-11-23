package br.com.gelu.menu.familyspace.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateFamilySpaceItemRequest(
    UUID familyId,
    @NotBlank(message = "Category is required") String category,
    @NotBlank(message = "Title is required") String title,
    String description,
    String highlightTag,
    Boolean pinned,
    Integer orderIndex) {}
