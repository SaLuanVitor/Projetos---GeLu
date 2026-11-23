package br.com.gelu.menu.family.dto;

import jakarta.validation.constraints.NotBlank;

public record AddFamilyMemberRequest(
    @NotBlank(message = "User ID or Email is required") String userId, String role) {}
