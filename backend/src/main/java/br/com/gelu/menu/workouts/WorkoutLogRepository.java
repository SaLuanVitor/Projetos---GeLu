package br.com.gelu.menu.workouts;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID> {

  @Query(
      "SELECT l FROM WorkoutLog l WHERE l.user.id = :userId AND l.performedAt >= :start AND l.performedAt < :end ORDER BY l.performedAt DESC")
  List<WorkoutLog> findAllByUserAndDateRange(
      @Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

  @Query(
      "SELECT l FROM WorkoutLog l WHERE (l.user.id = :userId OR l.family.id = :familyId) ORDER BY l.performedAt DESC")
  List<WorkoutLog> findAllRecent(
      @Param("userId") UUID userId, @Param("familyId") UUID familyId);
}
