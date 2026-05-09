package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.auth.dto.LoginRequest;
import br.com.gelu.menu.auth.dto.RefreshTokenRequest;
import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.service.AuthService;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.auth.token.RefreshToken;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.auth.token.TokenPair;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.UnauthorizedException;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
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
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
  private final JwtTokenService jwtTokenService = org.mockito.Mockito.mock(JwtTokenService.class);
  private final AuthService authService =
      new AuthService(userRepository, refreshTokenRepository, passwordEncoder, jwtTokenService);

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
}
