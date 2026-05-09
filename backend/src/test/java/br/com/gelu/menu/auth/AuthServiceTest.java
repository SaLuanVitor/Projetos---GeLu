package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.service.AuthService;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
  private final AuthService authService = new AuthService(userRepository, passwordEncoder);

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
}
