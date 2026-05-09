package br.com.gelu.menu.auth.service;

import br.com.gelu.menu.auth.dto.AuthTokenResponse;
import br.com.gelu.menu.auth.dto.AuthUserResponse;
import br.com.gelu.menu.auth.dto.LoginRequest;
import br.com.gelu.menu.auth.dto.LogoutResponse;
import br.com.gelu.menu.auth.dto.RefreshTokenRequest;
import br.com.gelu.menu.auth.dto.RefreshTokenResponse;
import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.dto.RegisterResponse;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.auth.token.RefreshToken;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.auth.token.TokenPair;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.UnauthorizedException;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;

  public AuthService(
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      PasswordEncoder passwordEncoder,
      JwtTokenService jwtTokenService) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
  }

  @Transactional
  public RegisterResponse register(RegisterRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new ConflictException("Email already registered");
    }

    User user =
        userRepository.save(
            new User(
                request.name().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password())));

    return new RegisterResponse(
        user.getId(), user.getName(), user.getEmail(), user.isActive(), user.getCreatedAt());
  }

  @Transactional
  public AuthTokenResponse login(LoginRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
    User user =
        userRepository
            .findByEmail(normalizedEmail)
            .filter(User::isActive)
            .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new UnauthorizedException("Invalid email or password");
    }

    TokenPair tokenPair = jwtTokenService.issueTokenPair(user);
    return new AuthTokenResponse(
        tokenPair.accessToken(),
        tokenPair.refreshToken(),
        jwtTokenService.getTokenType(),
        tokenPair.expiresIn(),
        new AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.isActive()));
  }

  @Transactional
  public RefreshTokenResponse refresh(RefreshTokenRequest request) {
    String tokenHash = jwtTokenService.hashRefreshToken(request.refreshToken());
    RefreshToken refreshToken =
        refreshTokenRepository
            .findByTokenHash(tokenHash)
            .filter(token -> !token.isRevoked())
            .filter(token -> !token.isExpired())
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

    User user =
        userRepository
            .findById(refreshToken.getUserId())
            .filter(User::isActive)
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

    refreshToken.revoke();
    TokenPair tokenPair = jwtTokenService.issueTokenPair(user);
    return new RefreshTokenResponse(
        tokenPair.accessToken(),
        tokenPair.refreshToken(),
        jwtTokenService.getTokenType(),
        tokenPair.expiresIn());
  }

  @Transactional
  public LogoutResponse logout(RefreshTokenRequest request) {
    String tokenHash = jwtTokenService.hashRefreshToken(request.refreshToken());
    RefreshToken refreshToken =
        refreshTokenRepository
            .findByTokenHash(tokenHash)
            .filter(token -> !token.isRevoked())
            .filter(token -> !token.isExpired())
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

    refreshToken.revoke();
    return new LogoutResponse(true);
  }
}
