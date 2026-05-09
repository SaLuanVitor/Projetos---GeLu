package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.auth.token.RefreshToken;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class JwtTokenServiceTest {

  private final RefreshTokenRepository refreshTokenRepository =
      org.mockito.Mockito.mock(RefreshTokenRepository.class);
  private final JwtTokenService jwtTokenService =
      new JwtTokenService(
          new ObjectMapper(),
          refreshTokenRepository,
          "test-secret-with-enough-length",
          Duration.ofMinutes(15),
          Duration.ofDays(30));

  @Test
  void shouldIssueJwtAccessTokenAndPersistOnlyRefreshTokenHash() {
    User user = new User("Luan", "luan@example.com", "password-hash");
    when(refreshTokenRepository.save(any(RefreshToken.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var tokenPair = jwtTokenService.issueTokenPair(user);

    assertThat(tokenPair.accessToken()).contains(".");
    assertThat(tokenPair.accessToken().split("\\.")).hasSize(3);
    assertThat(tokenPair.refreshToken()).isNotBlank();
    assertThat(tokenPair.expiresIn()).isEqualTo(900);

    ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
    verify(refreshTokenRepository).save(captor.capture());
    RefreshToken savedToken = captor.getValue();

    assertThat(savedToken.getUserId()).isEqualTo(user.getId());
    assertThat(savedToken.getTokenHash()).isNotEqualTo(tokenPair.refreshToken());
    assertThat(savedToken.getTokenHash()).hasSize(64);
  }
}
