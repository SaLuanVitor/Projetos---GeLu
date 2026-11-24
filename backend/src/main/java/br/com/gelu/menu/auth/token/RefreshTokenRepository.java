package br.com.gelu.menu.auth.token;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  List<RefreshToken> findByUserIdAndRevokedAtIsNull(UUID userId);

  @org.springframework.data.jpa.repository.Query(
      "SELECT COUNT(r) FROM RefreshToken r WHERE r.revokedAt IS NULL AND r.expiresAt > CURRENT_TIMESTAMP")
  long countActiveSessions();
}
