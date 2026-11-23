package br.com.gelu.menu.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String name,
    String email,
    boolean active,
    LocalDateTime createdAt,
    long familiesCount) {}
