package br.com.gelu.menu.auth.controller;

import br.com.gelu.menu.auth.dto.AuthTokenResponse;
import br.com.gelu.menu.auth.dto.LoginRequest;
import br.com.gelu.menu.auth.dto.LogoutResponse;
import br.com.gelu.menu.auth.dto.RefreshTokenRequest;
import br.com.gelu.menu.auth.dto.RefreshTokenResponse;
import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.dto.RegisterResponse;
import br.com.gelu.menu.auth.service.AuthService;
import br.com.gelu.menu.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Auth", description = "Authentication and account endpoints")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @Operation(summary = "Register a new user")
  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ApiResponse.ok(authService.register(request), "User registered successfully");
  }

  @Operation(summary = "Authenticate an existing user")
  @PostMapping("/login")
  public ApiResponse<AuthTokenResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiResponse.ok(authService.login(request), "User authenticated successfully");
  }

  @Operation(summary = "Refresh authentication tokens")
  @PostMapping("/refresh")
  public ApiResponse<RefreshTokenResponse> refresh(
      @Valid @RequestBody RefreshTokenRequest request) {
    return ApiResponse.ok(authService.refresh(request), "Token refreshed successfully");
  }

  @Operation(summary = "Logout the current refresh token session")
  @PostMapping("/logout")
  public ApiResponse<LogoutResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
    return ApiResponse.ok(authService.logout(request), "User logged out successfully");
  }
}
