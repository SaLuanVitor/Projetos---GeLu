package br.com.gelu.menu.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record RegisterResponse(
    UUID id, String name, String email, boolean active, LocalDateTime createdAt) {}
