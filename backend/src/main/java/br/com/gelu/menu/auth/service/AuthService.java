package br.com.gelu.menu.auth.service;

import br.com.gelu.menu.auth.dto.AuthTokenResponse;
import br.com.gelu.menu.auth.dto.AuthUserResponse;
import br.com.gelu.menu.auth.dto.ForgotPasswordRequest;
import br.com.gelu.menu.auth.dto.ForgotPasswordResponse;
import br.com.gelu.menu.auth.dto.LoginRequest;
import br.com.gelu.menu.auth.dto.LogoutResponse;
import br.com.gelu.menu.auth.dto.RefreshTokenRequest;
import br.com.gelu.menu.auth.dto.RefreshTokenResponse;
import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.dto.RegisterResponse;
import br.com.gelu.menu.auth.dto.ResetPasswordRequest;
import br.com.gelu.menu.auth.dto.ResetPasswordResponse;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.auth.token.PasswordResetToken;
import br.com.gelu.menu.auth.token.PasswordResetTokenRepository;
import br.com.gelu.menu.auth.token.RefreshToken;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.auth.token.TokenPair;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.UnauthorizedException;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private static final int PASSWORD_RESET_TOKEN_BYTES = 32;

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;
  private final SecureRandom secureRandom;
  private final Duration passwordResetTokenTtl;
  private final boolean exposePasswordResetToken;

  public AuthService(
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      PasswordEncoder passwordEncoder,
      JwtTokenService jwtTokenService,
      @Value("${gelu.auth.password-reset-token-ttl}") Duration passwordResetTokenTtl,
      @Value("${gelu.auth.expose-password-reset-token}") boolean exposePasswordResetToken) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
    this.secureRandom = new SecureRandom();
    this.passwordResetTokenTtl = passwordResetTokenTtl;
    this.exposePasswordResetToken = exposePasswordResetToken;
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

  @Transactional
  public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
    return userRepository
        .findByEmail(normalizedEmail)
        .filter(User::isActive)
        .map(this::createPasswordResetResponse)
        .orElseGet(() -> new ForgotPasswordResponse(true, null));
  }

  @Transactional
  public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
    String tokenHash = hashPasswordResetToken(request.token());
    PasswordResetToken resetToken =
        passwordResetTokenRepository
            .findByTokenHash(tokenHash)
            .filter(token -> !token.isUsed())
            .filter(token -> !token.isExpired())
            .orElseThrow(() -> new UnauthorizedException("Invalid password reset token"));

    User user =
        userRepository
            .findById(resetToken.getUserId())
            .filter(User::isActive)
            .orElseThrow(() -> new UnauthorizedException("Invalid password reset token"));

    user.updatePasswordHash(passwordEncoder.encode(request.newPassword()));
    resetToken.markUsed();
    return new ResetPasswordResponse(true);
  }

  private ForgotPasswordResponse createPasswordResetResponse(User user) {
    String resetToken = createPasswordResetToken();
    passwordResetTokenRepository.save(
        new PasswordResetToken(
            user.getId(),
            hashPasswordResetToken(resetToken),
            LocalDateTime.now().plus(passwordResetTokenTtl)));

    return new ForgotPasswordResponse(true, exposePasswordResetToken ? resetToken : null);
  }

  private String createPasswordResetToken() {
    byte[] tokenBytes = new byte[PASSWORD_RESET_TOKEN_BYTES];
    secureRandom.nextBytes(tokenBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
  }

  private String hashPasswordResetToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available", exception);
    }
  }
}
