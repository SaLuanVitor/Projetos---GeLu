package br.com.gelu.menu.meals;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MealLogRepository extends JpaRepository<MealLog, UUID> {

  List<MealLog> findAllByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(
      UUID userId, LocalDateTime start, LocalDateTime end);

  List<MealLog> findAllByFamilyIdAndConsumedAtBetweenOrderByConsumedAtDesc(
      UUID familyId, LocalDateTime start, LocalDateTime end);

  @Query("SELECT COUNT(m) FROM MealLog m WHERE m.userId = :userId AND m.consumedAt >= :since")
  long countByUserIdSince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
}
