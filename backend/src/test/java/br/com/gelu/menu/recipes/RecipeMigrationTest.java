package br.com.gelu.menu.recipes;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class RecipeMigrationTest {

  private static final Path RECIPES_MIGRATION =
      Path.of("src/main/resources/db/migration/V004__create_recipes.sql");
  private static final Path MEDIA_MIGRATION =
      Path.of("src/main/resources/db/migration/V005__create_recipe_media.sql");

  @Test
  void shouldCreateRecipeTables() throws Exception {
    String migration = Files.readString(RECIPES_MIGRATION);

    assertThat(migration).contains("CREATE TABLE recipes");
    assertThat(migration).contains("CREATE TABLE recipe_ingredients");
    assertThat(migration).contains("CREATE TABLE recipe_steps");
    assertThat(migration).contains("user_id UUID NOT NULL REFERENCES users(id)");
    assertThat(migration).contains("ON DELETE CASCADE");
  }

  @Test
  void shouldCreateRecipeMediaTable() throws Exception {
    String migration = Files.readString(MEDIA_MIGRATION);

    assertThat(migration).contains("CREATE TABLE recipe_media");
    assertThat(migration)
        .contains("recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE");
    assertThat(migration).contains("object_key VARCHAR(700) NOT NULL UNIQUE");
    assertThat(migration).contains("is_main BOOLEAN NOT NULL DEFAULT FALSE");
    assertThat(migration).contains("idx_recipe_media_one_main");
  }
}
