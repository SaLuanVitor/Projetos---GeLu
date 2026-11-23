package br.com.gelu.menu.schedule;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyWeeklyGoalRepository extends JpaRepository<FamilyWeeklyGoal, UUID> {

  List<FamilyWeeklyGoal> findAllByFamilyId(UUID familyId);

  List<FamilyWeeklyGoal> findAllByUserIdAndFamilyIsNull(UUID userId);
}
