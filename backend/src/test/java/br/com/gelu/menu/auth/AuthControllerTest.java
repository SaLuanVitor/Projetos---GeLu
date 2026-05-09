package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.controller.AuthController;
import br.com.gelu.menu.auth.service.AuthService;
import br.com.gelu.menu.auth.token.JwtTokenService;
import br.com.gelu.menu.auth.token.PasswordResetToken;
import br.com.gelu.menu.auth.token.PasswordResetTokenRepository;
import br.com.gelu.menu.auth.token.RefreshToken;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.auth.token.TokenPair;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({AuthService.class, GlobalExceptionHandler.class, TestPasswordConfig.class})
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private UserRepository userRepository;

  @MockBean private RefreshTokenRepository refreshTokenRepository;

  @MockBean private PasswordResetTokenRepository passwordResetTokenRepository;

  @MockBean private JwtTokenService jwtTokenService;

  @Test
  void shouldRegisterUserWithoutReturningPassword() throws Exception {
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    MvcResult result =
        mockMvc
            .perform(
                post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "name": "Luan",
                          "email": "LUAN@EXAMPLE.COM",
                          "password": "strong-password"
                        }
                        """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Luan"))
            .andExpect(jsonPath("$.data.email").value("luan@example.com"))
            .andExpect(jsonPath("$.data.active").value(true))
            .andExpect(jsonPath("$.data.password").doesNotExist())
            .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
            .andReturn();

    assertThat(result.getResponse().getContentAsString()).doesNotContain("strong-password");
  }

  @Test
  void shouldRejectDuplicatedEmail() throws Exception {
    when(userRepository.existsByEmail("luan@example.com")).thenReturn(true);

    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Luan",
                      "email": "luan@example.com",
                      "password": "strong-password"
                    }
                    """))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("CONFLICT"))
        .andExpect(jsonPath("$.error.message").value("Email already registered"));
  }

  @Test
  void shouldRejectInvalidPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "",
                      "email": "invalid",
                      "password": "short"
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldLoginWithValidCredentials() throws Exception {
    User user =
        new User(
            "Luan",
            "luan@example.com",
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                .encode("strong-password"));
    when(userRepository.findByEmail("luan@example.com")).thenReturn(Optional.of(user));
    when(jwtTokenService.issueTokenPair(user))
        .thenReturn(new TokenPair("access.jwt.token", "refresh-token", 900));
    when(jwtTokenService.getTokenType()).thenReturn("Bearer");

    MvcResult result =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "email": "LUAN@EXAMPLE.COM",
                          "password": "strong-password"
                        }
                        """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("access.jwt.token"))
            .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
            .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.data.expiresIn").value(900))
            .andExpect(jsonPath("$.data.user.email").value("luan@example.com"))
            .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
            .andReturn();

    assertThat(result.getResponse().getContentAsString()).doesNotContain("strong-password");
  }

  @Test
  void shouldRejectLoginWithInvalidCredentials() throws Exception {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "email": "missing@example.com",
                      "password": "strong-password"
                    }
                    """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
        .andExpect(jsonPath("$.error.message").value("Invalid email or password"));
  }

  @Test
  void shouldRejectInvalidLoginPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "email": "invalid",
                      "password": "short"
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldRefreshTokens() throws Exception {
    User user = new User("Luan", "luan@example.com", "password-hash");
    RefreshToken refreshToken =
        new RefreshToken(user.getId(), "hashed-refresh-token", LocalDateTime.now().plusDays(30));
    when(jwtTokenService.hashRefreshToken("refresh-token")).thenReturn("hashed-refresh-token");
    when(refreshTokenRepository.findByTokenHash("hashed-refresh-token"))
        .thenReturn(Optional.of(refreshToken));
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(jwtTokenService.issueTokenPair(user))
        .thenReturn(new TokenPair("new.access.jwt", "new-refresh-token", 900));
    when(jwtTokenService.getTokenType()).thenReturn("Bearer");

    mockMvc
        .perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "refreshToken": "refresh-token"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.accessToken").value("new.access.jwt"))
        .andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"))
        .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.data.expiresIn").value(900));
  }

  @Test
  void shouldRejectInvalidRefreshToken() throws Exception {
    when(jwtTokenService.hashRefreshToken("invalid-refresh-token")).thenReturn("invalid-hash");
    when(refreshTokenRepository.findByTokenHash("invalid-hash")).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "refreshToken": "invalid-refresh-token"
                    }
                    """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
        .andExpect(jsonPath("$.error.message").value("Invalid refresh token"));
  }

  @Test
  void shouldLogoutRefreshToken() throws Exception {
    RefreshToken refreshToken =
        new RefreshToken(
            java.util.UUID.randomUUID(), "hashed-refresh-token", LocalDateTime.now().plusDays(30));
    when(jwtTokenService.hashRefreshToken("refresh-token")).thenReturn("hashed-refresh-token");
    when(refreshTokenRepository.findByTokenHash("hashed-refresh-token"))
        .thenReturn(Optional.of(refreshToken));

    mockMvc
        .perform(
            post("/api/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "refreshToken": "refresh-token"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.revoked").value(true))
        .andExpect(jsonPath("$.message").value("User logged out successfully"));
  }

  @Test
  void shouldRejectLogoutWithInvalidRefreshToken() throws Exception {
    when(jwtTokenService.hashRefreshToken("invalid-refresh-token")).thenReturn("invalid-hash");
    when(refreshTokenRepository.findByTokenHash("invalid-hash")).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "refreshToken": "invalid-refresh-token"
                    }
                    """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
        .andExpect(jsonPath("$.error.message").value("Invalid refresh token"));
  }

  @Test
  void shouldRejectInvalidLogoutPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "refreshToken": ""
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldRequestPasswordResetForExistingUser() throws Exception {
    User user = new User("Luan", "luan@example.com", "password-hash");
    when(userRepository.findByEmail("luan@example.com")).thenReturn(Optional.of(user));
    when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    mockMvc
        .perform(
            post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "email": "LUAN@EXAMPLE.COM"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.accepted").value(true))
        .andExpect(jsonPath("$.data.resetToken").isNotEmpty())
        .andExpect(jsonPath("$.message").value("Password reset request accepted"));
  }

  @Test
  void shouldAcceptPasswordResetRequestForMissingUser() throws Exception {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "email": "missing@example.com"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.accepted").value(true))
        .andExpect(jsonPath("$.data.resetToken").doesNotExist());
  }

  @Test
  void shouldRejectInvalidForgotPasswordPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "email": "invalid"
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void shouldResetPassword() throws Exception {
    User user =
        new User(
            "Luan",
            "luan@example.com",
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                .encode("old-password"));
    String tokenHash = hashToken("valid-reset-token");
    PasswordResetToken resetToken =
        new PasswordResetToken(user.getId(), tokenHash, LocalDateTime.now().plusMinutes(30));
    when(passwordResetTokenRepository.findByTokenHash(tokenHash))
        .thenReturn(Optional.of(resetToken));
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

    mockMvc
        .perform(
            post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "token": "valid-reset-token",
                      "newPassword": "new-strong-password"
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.reset").value(true))
        .andExpect(jsonPath("$.message").value("Password reset successfully"));
  }

  @Test
  void shouldRejectInvalidPasswordResetToken() throws Exception {
    when(passwordResetTokenRepository.findByTokenHash(hashToken("invalid-reset-token")))
        .thenReturn(Optional.empty());

    mockMvc
        .perform(
            post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "token": "invalid-reset-token",
                      "newPassword": "new-strong-password"
                    }
                    """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
        .andExpect(jsonPath("$.error.message").value("Invalid password reset token"));
  }

  @Test
  void shouldRejectInvalidResetPasswordPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "token": "",
                      "newPassword": "short"
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
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
