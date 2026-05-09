package br.com.gelu.menu.auth.service;

import br.com.gelu.menu.auth.dto.RegisterRequest;
import br.com.gelu.menu.auth.dto.RegisterResponse;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
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
}
