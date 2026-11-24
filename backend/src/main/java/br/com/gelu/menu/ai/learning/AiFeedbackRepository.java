package br.com.gelu.menu.ai.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AiFeedbackRepository extends JpaRepository<AiFeedback, UUID> {

    List<AiFeedback> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM AiFeedback f WHERE f.userId = :userId AND f.positive = false ORDER BY f.createdAt DESC")
    List<AiFeedback> findNegativeFeedbackByUserId(@Param("userId") UUID userId);

    long countByPositive(boolean positive);

    List<AiFeedback> findTop50ByOrderByCreatedAtDesc();
}
