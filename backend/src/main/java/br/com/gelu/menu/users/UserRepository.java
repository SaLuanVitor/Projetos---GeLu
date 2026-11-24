package br.com.gelu.menu.users;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

  boolean existsByEmail(String email);

  Optional<User> findByEmail(String email);

  @org.springframework.data.jpa.repository.Query(
      "SELECT COUNT(u) FROM User u WHERE u.updatedAt >= :since")
  long countActiveSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
}
