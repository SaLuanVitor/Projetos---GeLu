package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class AuthMigrationTest {

  private static final Path AUTH_MIGRATION =
      Path.of("src/main/resources/db/migration/V002__create_auth_tokens.sql");

  @Test
  void shouldCreateAuthTokenTables() throws Exception {
    String migration = Files.readString(AUTH_MIGRATION);

    assertThat(migration).contains("CREATE TABLE refresh_tokens");
    assertThat(migration).contains("CREATE TABLE password_reset_tokens");
    assertThat(migration).contains("REFERENCES users(id)");
    assertThat(migration).contains("token_hash VARCHAR(255) NOT NULL");
  }
}
