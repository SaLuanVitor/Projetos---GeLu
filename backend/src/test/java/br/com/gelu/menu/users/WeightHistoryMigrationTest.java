package br.com.gelu.menu.users;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class WeightHistoryMigrationTest {

  private static final Path MIGRATION =
      Path.of("src/main/resources/db/migration/V003__create_weight_history.sql");

  @Test
  void shouldCreateWeightHistoryTable() throws Exception {
    String migration = Files.readString(MIGRATION);

    assertThat(migration).contains("CREATE TABLE weight_history");
    assertThat(migration).contains("user_id UUID NOT NULL REFERENCES users(id)");
    assertThat(migration).contains("weight_kg NUMERIC(6,2) NOT NULL");
    assertThat(migration).contains("idx_weight_history_user_recorded_at");
  }
}
