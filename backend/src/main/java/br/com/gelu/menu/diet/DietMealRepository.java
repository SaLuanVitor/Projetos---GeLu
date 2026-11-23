package br.com.gelu.menu.diet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DietMealRepository extends JpaRepository<DietMeal, UUID> {

  List<DietMeal> findByDietIdOrderByWeekDayAscOrderIndexAscMealTimeAsc(UUID dietId);

  List<DietMeal> findByDietIdAndWeekDayOrderByOrderIndexAscMealTimeAsc(UUID dietId, String weekDay);
}
