package br.com.gelu.menu.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class ScheduleMigrationTest {

  private static final Path MIGRATION =
      Path.of("src/main/resources/db/migration/V008__create_schedule_and_notes_tables.sql");

  @Test
  void shouldCreateScheduleAndNotesTables() throws Exception {
    String migration = Files.readString(MIGRATION);

    assertThat(migration).contains("CREATE TABLE couple_notes");
    assertThat(migration).contains("CREATE TABLE schedule_activities");
    assertThat(migration).contains("CREATE TABLE schedule_completions");
    assertThat(migration).contains("CREATE TABLE family_weekly_goals");
    assertThat(migration).contains("REFERENCES families(id)");
    assertThat(migration).contains("uk_activity_date UNIQUE");
  }
}
