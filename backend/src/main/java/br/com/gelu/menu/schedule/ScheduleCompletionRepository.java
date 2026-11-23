package br.com.gelu.menu.schedule;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleCompletionRepository extends JpaRepository<ScheduleCompletion, UUID> {

  Optional<ScheduleCompletion> findByActivityIdAndCompletionDate(
      UUID activityId, LocalDate completionDate);

  boolean existsByActivityIdAndCompletionDate(UUID activityId, LocalDate completionDate);

  void deleteByActivityIdAndCompletionDate(UUID activityId, LocalDate completionDate);

  @Query(
      "SELECT c FROM ScheduleCompletion c WHERE c.activity.family.id = :familyId AND"
          + " c.completionDate BETWEEN :startDate AND :endDate")
  List<ScheduleCompletion> findByFamilyAndDateRange(
      @Param("familyId") UUID familyId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  @Query(
      "SELECT c FROM ScheduleCompletion c WHERE (c.activity.user.id = :userId OR c.completedBy.id = :userId) AND"
          + " c.completionDate BETWEEN :startDate AND :endDate")
  List<ScheduleCompletion> findByUserIdAndDateRange(
      @Param("userId") UUID userId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);
}
