package br.com.gelu.menu.auth.dto;

public record RefreshTokenResponse(
    String accessToken, String refreshToken, String tokenType, long expiresIn) {}
