package br.com.gelu.menu.admin;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, UUID> {

  List<AiUsageLog> findTop50ByOrderByCreatedAtDesc();

  @Query("SELECT COALESCE(SUM(l.totalTokens), 0) FROM AiUsageLog l")
  long sumTotalTokens();

  @Query("SELECT COALESCE(SUM(l.promptTokens), 0) FROM AiUsageLog l")
  long sumPromptTokens();

  @Query("SELECT COALESCE(SUM(l.completionTokens), 0) FROM AiUsageLog l")
  long sumCompletionTokens();

  @Query("SELECT COUNT(l) FROM AiUsageLog l WHERE l.familyId = :familyId AND l.createdAt >= :since")
  long countSinceByFamilyId(@Param("familyId") UUID familyId, @Param("since") LocalDateTime since);

  @Query("SELECT COUNT(l) FROM AiUsageLog l WHERE l.userId = :userId AND l.createdAt >= :since")
  long countSinceByUserId(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
}
