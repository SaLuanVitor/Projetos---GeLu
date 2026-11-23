package br.com.gelu.menu.couplenotes;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoupleNoteRepository extends JpaRepository<CoupleNote, UUID> {

  @Query(
      "SELECT n FROM CoupleNote n WHERE n.family.id = :familyId AND "
          + "(n.recipient IS NULL OR n.recipient.id = :userId OR n.author.id = :userId) "
          + "ORDER BY n.pinned DESC, n.createdAt DESC")
  List<CoupleNote> findAllByFamilyIdAndVisible(
      @Param("familyId") UUID familyId, @Param("userId") UUID userId);

  @Query(
      "SELECT n FROM CoupleNote n WHERE n.family.id = :familyId AND n.resolved = false AND "
          + "(n.recipient IS NULL OR n.recipient.id = :userId OR n.author.id = :userId) "
          + "ORDER BY n.pinned DESC, n.createdAt DESC")
  List<CoupleNote> findActiveByFamilyIdAndVisible(
      @Param("familyId") UUID familyId, @Param("userId") UUID userId);

  @Query(
      "SELECT n FROM CoupleNote n WHERE n.family.id = :familyId ORDER BY n.pinned DESC, n.createdAt DESC")
  List<CoupleNote> findAllByFamilyId(@Param("familyId") UUID familyId);
}
