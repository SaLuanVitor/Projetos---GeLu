package br.com.gelu.menu.diet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeeklyDietRepository extends JpaRepository<WeeklyDiet, UUID> {

  Optional<WeeklyDiet> findByFamilyIdAndWeekStart(UUID familyId, LocalDate weekStart);

  Optional<WeeklyDiet> findByUserIdAndWeekStartAndFamilyIsNull(UUID userId, LocalDate weekStart);

  List<WeeklyDiet> findAllByFamilyIdOrderByWeekStartDesc(UUID familyId);

  List<WeeklyDiet> findAllByUserIdAndFamilyIsNullOrderByWeekStartDesc(UUID userId);
}
