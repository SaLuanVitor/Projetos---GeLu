package br.com.gelu.menu.ai.grounding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TacoFoodRepository extends JpaRepository<TacoFood, UUID> {

    @Query("SELECT t FROM TacoFood t WHERE LOWER(t.foodName) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY LENGTH(t.foodName) ASC")
    List<TacoFood> searchByName(@Param("query") String query);

    @Query("SELECT t FROM TacoFood t WHERE LOWER(t.foodName) = LOWER(:name)")
    Optional<TacoFood> findByExactNameIgnoreCase(@Param("name") String name);
}
