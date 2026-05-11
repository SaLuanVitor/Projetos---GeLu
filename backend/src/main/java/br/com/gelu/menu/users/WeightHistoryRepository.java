package br.com.gelu.menu.users;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeightHistoryRepository extends JpaRepository<WeightHistory, UUID> {

  List<WeightHistory> findByUserIdOrderByRecordedAtDesc(UUID userId);
}
