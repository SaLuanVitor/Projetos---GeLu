package br.com.gelu.menu.familyspace;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FamilySpaceItemRepository extends JpaRepository<FamilySpaceItem, UUID> {

  @Query(
      "SELECT s FROM FamilySpaceItem s WHERE s.family.id = :familyId ORDER BY s.pinned DESC, s.orderIndex ASC, s.createdAt DESC")
  List<FamilySpaceItem> findAllByFamilyId(@Param("familyId") UUID familyId);

  @Query(
      "SELECT s FROM FamilySpaceItem s WHERE s.family.id = :familyId AND s.category = :category ORDER BY s.pinned DESC, s.orderIndex ASC, s.createdAt DESC")
  List<FamilySpaceItem> findAllByFamilyIdAndCategory(
      @Param("familyId") UUID familyId, @Param("category") String category);
}
