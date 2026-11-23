package br.com.gelu.menu.family;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FamilyInviteRepository extends JpaRepository<FamilyInvite, UUID> {

  Optional<FamilyInvite> findByToken(String token);

  @Query(
      "SELECT i FROM FamilyInvite i JOIN FETCH i.family f JOIN FETCH i.invitedBy u WHERE f.id = :familyId AND i.status = :status ORDER BY i.createdAt DESC")
  List<FamilyInvite> findAllByFamilyIdAndStatus(
      @Param("familyId") UUID familyId, @Param("status") FamilyInviteStatus status);

  @Query(
      "SELECT i FROM FamilyInvite i WHERE i.family.id = :familyId AND i.invitedEmail = :email AND i.status = 'PENDING'")
  Optional<FamilyInvite> findPendingByFamilyIdAndEmail(
      @Param("familyId") UUID familyId, @Param("email") String email);
}
