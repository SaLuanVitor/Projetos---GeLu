package br.com.gelu.menu.recipes;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class RecipeMigrationTest {

  private static final Path MIGRATION =
      Path.of("src/main/resources/db/migration/V004__create_recipes.sql");

  @Test
  void shouldCreateRecipeTables() throws Exception {
    String migration = Files.readString(MIGRATION);

    assertThat(migration).contains("CREATE TABLE recipes");
    assertThat(migration).contains("CREATE TABLE recipe_ingredients");
    assertThat(migration).contains("CREATE TABLE recipe_steps");
    assertThat(migration).contains("user_id UUID NOT NULL REFERENCES users(id)");
    assertThat(migration).contains("ON DELETE CASCADE");
  }
}
