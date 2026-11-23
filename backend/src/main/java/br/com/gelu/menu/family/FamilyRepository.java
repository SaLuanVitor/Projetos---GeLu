package br.com.gelu.menu.family;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FamilyRepository extends JpaRepository<Family, UUID> {

  @Query(
      "SELECT DISTINCT f FROM Family f JOIN f.members m WHERE m.user.id = :userId ORDER BY"
          + " f.createdAt DESC")
  List<Family> findAllByMemberUserId(@Param("userId") UUID userId);

  @Query(
      "SELECT f FROM Family f LEFT JOIN FETCH f.members m LEFT JOIN FETCH m.user WHERE f.id = :id")
  Optional<Family> findByIdWithMembers(@Param("id") UUID id);
}
