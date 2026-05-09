package br.com.gelu.menu.auth.token;

public record TokenPair(String accessToken, String refreshToken, long expiresIn) {}
