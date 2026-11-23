package br.com.gelu.menu.family.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateFamilyRequest(
    @NotBlank(message = "Family name is required")
        @Size(max = 150, message = "Family name cannot exceed 150 characters")
        String name) {}
