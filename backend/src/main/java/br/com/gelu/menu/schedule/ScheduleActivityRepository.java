package br.com.gelu.menu.schedule;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleActivityRepository extends JpaRepository<ScheduleActivity, UUID> {

  @Query(
      "SELECT DISTINCT a FROM ScheduleActivity a LEFT JOIN FETCH a.assignees WHERE a.family.id = :familyId ORDER BY a.startTime ASC,"
          + " a.orderIndex ASC")
  List<ScheduleActivity> findAllByFamilyId(@Param("familyId") UUID familyId);

  @Query(
      "SELECT DISTINCT a FROM ScheduleActivity a LEFT JOIN FETCH a.assignees WHERE a.family.id = :familyId AND a.dayOfWeek = :dayOfWeek"
          + " ORDER BY a.startTime ASC, a.orderIndex ASC")
  List<ScheduleActivity> findByFamilyIdAndDayOfWeek(
      @Param("familyId") UUID familyId, @Param("dayOfWeek") String dayOfWeek);

  @Query(
      "SELECT DISTINCT a FROM ScheduleActivity a LEFT JOIN FETCH a.assignees WHERE (a.user.id = :userId OR :userId IN (SELECT ass.id FROM a.assignees ass)) AND a.family IS NULL ORDER BY a.startTime ASC,"
          + " a.orderIndex ASC")
  List<ScheduleActivity> findAllByUserIdAndFamilyIsNull(@Param("userId") UUID userId);

  @Query(
      "SELECT DISTINCT a FROM ScheduleActivity a LEFT JOIN FETCH a.assignees WHERE (a.user.id = :userId OR :userId IN (SELECT ass.id FROM a.assignees ass)) AND a.family IS NULL AND a.dayOfWeek = :dayOfWeek"
          + " ORDER BY a.startTime ASC, a.orderIndex ASC")
  List<ScheduleActivity> findByUserIdAndFamilyIsNullAndDayOfWeek(
      @Param("userId") UUID userId, @Param("dayOfWeek") String dayOfWeek);
}
