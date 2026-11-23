package br.com.gelu.menu.family;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {

  @Query("SELECT m FROM FamilyMember m WHERE m.family.id = :familyId AND m.user.id = :userId")
  Optional<FamilyMember> findByFamilyIdAndUserId(
      @Param("familyId") UUID familyId, @Param("userId") UUID userId);

  @Query(
      "SELECT COUNT(m) > 0 FROM FamilyMember m WHERE m.family.id = :familyId AND m.user.id ="
          + " :userId")
  boolean existsByFamilyIdAndUserId(@Param("familyId") UUID familyId, @Param("userId") UUID userId);

  @Modifying
  @Query("DELETE FROM FamilyMember m WHERE m.family.id = :familyId AND m.user.id = :userId")
  void deleteByFamilyIdAndUserId(@Param("familyId") UUID familyId, @Param("userId") UUID userId);
}
