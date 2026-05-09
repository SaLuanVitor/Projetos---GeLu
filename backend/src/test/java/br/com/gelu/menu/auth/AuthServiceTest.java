package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.auth.dto.ForgotPasswordRequest;
import br.com.gelu.menu.auth.dto.LoginRequest;
import br.com.gelu.menu.auth.dto.RefreshTokenRequest;
import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.dto.ResetPasswordRequest;
import br.com.gelu.menu.auth.service.AuthService;
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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
  private final RefreshTokenRepository refreshTokenRepository =
      org.mockito.Mockito.mock(RefreshTokenRepository.class);
  private final PasswordResetTokenRepository passwordResetTokenRepository =
      org.mockito.Mockito.mock(PasswordResetTokenRepository.class);
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
  private final JwtTokenService jwtTokenService = org.mockito.Mockito.mock(JwtTokenService.class);
  private final AuthService authService =
      new AuthService(
          userRepository,
          refreshTokenRepository,
          passwordResetTokenRepository,
          passwordEncoder,
          jwtTokenService,
          Duration.ofMinutes(30),
          true);

  @Test
  void shouldHashPasswordAndNormalizeEmail() {
    when(userRepository.existsByEmail("luan@example.com")).thenReturn(false);
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    authService.register(new RegisterRequest(" Luan ", " LUAN@EXAMPLE.COM ", "strong-password"));

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    org.mockito.Mockito.verify(userRepository).save(captor.capture());
    User user = captor.getValue();

    assertThat(user.getName()).isEqualTo("Luan");
    assertThat(user.getEmail()).isEqualTo("luan@example.com");
    assertThat(user.getPasswordHash()).isNotEqualTo("strong-password");
    assertThat(passwordEncoder.matches("strong-password", user.getPasswordHash())).isTrue();
  }

  @Test
  void shouldRejectDuplicatedEmail() {
    when(userRepository.existsByEmail("luan@example.com")).thenReturn(true);

    assertThatThrownBy(
            () ->
                authService.register(
                    new RegisterRequest("Luan", "luan@example.com", "strong-password")))
        .isInstanceOf(ConflictException.class)
        .hasMessage("Email already registered");
  }

  @Test
  void shouldLoginWithValidCredentials() {
    User user = new User("Luan", "luan@example.com", passwordEncoder.encode("strong-password"));
    when(userRepository.findByEmail("luan@example.com")).thenReturn(Optional.of(user));
    when(jwtTokenService.issueTokenPair(user))
        .thenReturn(new TokenPair("access.jwt.token", "refresh-token", 900));
    when(jwtTokenService.getTokenType()).thenReturn("Bearer");

    var response = authService.login(new LoginRequest(" LUAN@EXAMPLE.COM ", "strong-password"));

    assertThat(response.accessToken()).isEqualTo("access.jwt.token");
    assertThat(response.refreshToken()).isEqualTo("refresh-token");
    assertThat(response.tokenType()).isEqualTo("Bearer");
    assertThat(response.expiresIn()).isEqualTo(900);
    assertThat(response.user().email()).isEqualTo("luan@example.com");
  }

  @Test
  void shouldRejectLoginWithInvalidPassword() {
    User user = new User("Luan", "luan@example.com", passwordEncoder.encode("strong-password"));
    when(userRepository.findByEmail("luan@example.com")).thenReturn(Optional.of(user));

    assertThatThrownBy(
            () -> authService.login(new LoginRequest("luan@example.com", "wrong-password")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid email or password");
  }

  @Test
  void shouldRejectLoginWithMissingUser() {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    assertThatThrownBy(
            () -> authService.login(new LoginRequest("missing@example.com", "strong-password")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid email or password");
  }

  @Test
  void shouldRotateValidRefreshToken() {
    User user = new User("Luan", "luan@example.com", passwordEncoder.encode("strong-password"));
    RefreshToken refreshToken =
        new RefreshToken(user.getId(), "hashed-token", LocalDateTime.now().plusDays(30));
    when(jwtTokenService.hashRefreshToken("refresh-token")).thenReturn("hashed-token");
    when(refreshTokenRepository.findByTokenHash("hashed-token"))
        .thenReturn(Optional.of(refreshToken));
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(jwtTokenService.issueTokenPair(user))
        .thenReturn(new TokenPair("new.access.jwt", "new-refresh-token", 900));
    when(jwtTokenService.getTokenType()).thenReturn("Bearer");

    var response = authService.refresh(new RefreshTokenRequest("refresh-token"));

    assertThat(refreshToken.isRevoked()).isTrue();
    assertThat(response.accessToken()).isEqualTo("new.access.jwt");
    assertThat(response.refreshToken()).isEqualTo("new-refresh-token");
    assertThat(response.tokenType()).isEqualTo("Bearer");
    assertThat(response.expiresIn()).isEqualTo(900);
  }

  @Test
  void shouldRejectInvalidRefreshToken() {
    when(jwtTokenService.hashRefreshToken("invalid-refresh-token")).thenReturn("invalid-hash");
    when(refreshTokenRepository.findByTokenHash("invalid-hash")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authService.refresh(new RefreshTokenRequest("invalid-refresh-token")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid refresh token");
  }

  @Test
  void shouldRejectExpiredRefreshToken() {
    RefreshToken refreshToken =
        new RefreshToken(
            java.util.UUID.randomUUID(), "expired-hash", LocalDateTime.now().minusDays(1));
    when(jwtTokenService.hashRefreshToken("expired-refresh-token")).thenReturn("expired-hash");
    when(refreshTokenRepository.findByTokenHash("expired-hash"))
        .thenReturn(Optional.of(refreshToken));

    assertThatThrownBy(() -> authService.refresh(new RefreshTokenRequest("expired-refresh-token")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid refresh token");
  }

  @Test
  void shouldLogoutValidRefreshToken() {
    RefreshToken refreshToken =
        new RefreshToken(
            java.util.UUID.randomUUID(), "hashed-token", LocalDateTime.now().plusDays(30));
    when(jwtTokenService.hashRefreshToken("refresh-token")).thenReturn("hashed-token");
    when(refreshTokenRepository.findByTokenHash("hashed-token"))
        .thenReturn(Optional.of(refreshToken));

    var response = authService.logout(new RefreshTokenRequest("refresh-token"));

    assertThat(response.revoked()).isTrue();
    assertThat(refreshToken.isRevoked()).isTrue();
  }

  @Test
  void shouldRejectLogoutWithInvalidRefreshToken() {
    when(jwtTokenService.hashRefreshToken("invalid-refresh-token")).thenReturn("invalid-hash");
    when(refreshTokenRepository.findByTokenHash("invalid-hash")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authService.logout(new RefreshTokenRequest("invalid-refresh-token")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid refresh token");
  }

  @Test
  void shouldRejectLogoutWithRevokedRefreshToken() {
    RefreshToken refreshToken =
        new RefreshToken(
            java.util.UUID.randomUUID(), "revoked-hash", LocalDateTime.now().plusDays(30));
    refreshToken.revoke();
    when(jwtTokenService.hashRefreshToken("revoked-refresh-token")).thenReturn("revoked-hash");
    when(refreshTokenRepository.findByTokenHash("revoked-hash"))
        .thenReturn(Optional.of(refreshToken));

    assertThatThrownBy(() -> authService.logout(new RefreshTokenRequest("revoked-refresh-token")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid refresh token");
  }

  @Test
  void shouldCreatePasswordResetTokenForExistingUser() {
    User user = new User("Luan", "luan@example.com", passwordEncoder.encode("strong-password"));
    when(userRepository.findByEmail("luan@example.com")).thenReturn(Optional.of(user));
    when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var response = authService.forgotPassword(new ForgotPasswordRequest(" LUAN@EXAMPLE.COM "));

    assertThat(response.accepted()).isTrue();
    assertThat(response.resetToken()).isNotBlank();

    ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
    verify(passwordResetTokenRepository).save(captor.capture());
    PasswordResetToken resetToken = captor.getValue();
    assertThat(resetToken.getUserId()).isEqualTo(user.getId());
    assertThat(resetToken.getTokenHash()).isNotEqualTo(response.resetToken());
    assertThat(resetToken.getTokenHash()).hasSize(64);
  }

  @Test
  void shouldAcceptPasswordResetRequestForMissingUserWithoutCreatingToken() {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    var response = authService.forgotPassword(new ForgotPasswordRequest("missing@example.com"));

    assertThat(response.accepted()).isTrue();
    assertThat(response.resetToken()).isNull();
    verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
  }

  @Test
  void shouldResetPasswordWithValidToken() {
    User user = new User("Luan", "luan@example.com", passwordEncoder.encode("old-password"));
    String rawToken = "valid-reset-token";
    String tokenHash = hashToken(rawToken);
    PasswordResetToken resetToken =
        new PasswordResetToken(user.getId(), tokenHash, LocalDateTime.now().plusMinutes(30));
    when(passwordResetTokenRepository.findByTokenHash(tokenHash))
        .thenReturn(Optional.of(resetToken));
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

    var response =
        authService.resetPassword(new ResetPasswordRequest(rawToken, "new-strong-password"));

    assertThat(response.reset()).isTrue();
    assertThat(resetToken.isUsed()).isTrue();
    assertThat(passwordEncoder.matches("new-strong-password", user.getPasswordHash())).isTrue();
    assertThat(passwordEncoder.matches("old-password", user.getPasswordHash())).isFalse();
  }

  @Test
  void shouldRejectUsedPasswordResetToken() {
    PasswordResetToken resetToken =
        new PasswordResetToken(
            java.util.UUID.randomUUID(),
            hashToken("used-reset-token"),
            LocalDateTime.now().plusMinutes(30));
    resetToken.markUsed();
    when(passwordResetTokenRepository.findByTokenHash(hashToken("used-reset-token")))
        .thenReturn(Optional.of(resetToken));

    assertThatThrownBy(
            () ->
                authService.resetPassword(
                    new ResetPasswordRequest("used-reset-token", "new-strong-password")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid password reset token");
  }

  @Test
  void shouldRejectExpiredPasswordResetToken() {
    PasswordResetToken resetToken =
        new PasswordResetToken(
            java.util.UUID.randomUUID(),
            hashToken("expired-reset-token"),
            LocalDateTime.now().minusMinutes(1));
    when(passwordResetTokenRepository.findByTokenHash(hashToken("expired-reset-token")))
        .thenReturn(Optional.of(resetToken));

    assertThatThrownBy(
            () ->
                authService.resetPassword(
                    new ResetPasswordRequest("expired-reset-token", "new-strong-password")))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Invalid password reset token");
  }

  private String hashToken(String token) {
    try {
      java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
      return java.util.HexFormat.of()
          .formatHex(digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }
}
