package br.com.gelu.menu.auth.dto;

import java.util.UUID;

public record AuthUserResponse(UUID id, String name, String email, boolean active) {}
