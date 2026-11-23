package br.com.gelu.menu.admin;

import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SuperAdminInitializer implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(SuperAdminInitializer.class);

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final String superAdminEmail;
  private final String superAdminPassword;

  public SuperAdminInitializer(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      @Value("${gelu.super-admin-email:luanvitors_852@hotmail.com}") String superAdminEmail,
      @Value("${gelu.super-admin-password:}") String superAdminPassword) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.superAdminEmail = superAdminEmail;
    this.superAdminPassword = superAdminPassword;
  }

  @Override
  public void run(String... args) {
    if (superAdminEmail == null || superAdminEmail.isBlank()) {
      return;
    }

    String email = superAdminEmail.trim().toLowerCase();
    userRepository
        .findByEmail(email)
        .ifPresentOrElse(
            user -> {
              boolean changed = false;
              if (user.getAdminRole() != AdminRole.SUPER_ADMIN) {
                user.setAdminRole(AdminRole.SUPER_ADMIN);
                changed = true;
              }
              if (superAdminPassword != null && !superAdminPassword.isBlank()) {
                user.updatePasswordHash(passwordEncoder.encode(superAdminPassword.trim()));
                changed = true;
                log.info("Super Admin [{}] sincronizado com a senha definida no .env.", email);
              }
              if (changed) {
                userRepository.save(user);
              }
            },
            () -> {
              String rawPass = (superAdminPassword != null && !superAdminPassword.isBlank())
                  ? superAdminPassword.trim()
                  : "admin123456";
              User admin = new User("Super Admin", email, passwordEncoder.encode(rawPass));
              admin.setAdminRole(AdminRole.SUPER_ADMIN);
              userRepository.save(admin);
              log.info("Super Admin [{}] criado com sucesso via inicializador.", email);
            });
  }
}
