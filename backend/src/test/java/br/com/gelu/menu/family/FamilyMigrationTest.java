package br.com.gelu.menu.family;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class FamilyMigrationTest {

  private static final Path FAMILY_MIGRATION =
      Path.of("src/main/resources/db/migration/V007__create_family_tables.sql");

  @Test
  void shouldCreateFamilyTables() throws Exception {
    String migration = Files.readString(FAMILY_MIGRATION);

    assertThat(migration).contains("CREATE TABLE families");
    assertThat(migration).contains("CREATE TABLE family_members");
    assertThat(migration).contains("REFERENCES users(id)");
    assertThat(migration).contains("REFERENCES families(id)");
    assertThat(migration).contains("uk_family_user UNIQUE");
  }
}
