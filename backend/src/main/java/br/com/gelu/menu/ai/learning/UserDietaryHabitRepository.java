package br.com.gelu.menu.ai.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserDietaryHabitRepository extends JpaRepository<UserDietaryHabit, UUID> {
}
