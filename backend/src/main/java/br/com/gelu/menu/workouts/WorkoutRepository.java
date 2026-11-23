package br.com.gelu.menu.workouts;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

  @Query(
      "SELECT w FROM Workout w WHERE w.user.id = :userId OR (w.family.id = :familyId) ORDER BY w.title ASC")
  List<Workout> findAllByUserIdOrFamilyId(
      @Param("userId") UUID userId, @Param("familyId") UUID familyId);

  List<Workout> findAllByUserIdOrderByTitleAsc(UUID userId);
}
