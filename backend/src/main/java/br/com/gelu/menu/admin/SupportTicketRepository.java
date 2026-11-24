package br.com.gelu.menu.admin;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

  @Query("SELECT t FROM SupportTicket t JOIN FETCH t.user u ORDER BY t.createdAt DESC")
  List<SupportTicket> findAllWithUser();

  @Query(
      "SELECT t FROM SupportTicket t JOIN FETCH t.user u WHERE t.status = :status ORDER BY t.createdAt DESC")
  List<SupportTicket> findAllByStatusWithUser(@Param("status") String status);

  @Query(
      "SELECT t FROM SupportTicket t JOIN FETCH t.user u WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
  List<SupportTicket> findAllByUserId(@Param("userId") UUID userId);

  @Query(
      "SELECT DISTINCT t FROM SupportTicket t JOIN FETCH t.user u WHERE t.user.id IN :userIds ORDER BY t.createdAt DESC")
  List<SupportTicket> findAllByUserIds(@Param("userIds") List<UUID> userIds);

  long countByStatus(String status);

  @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.status = 'OPEN' AND (t.category = 'BUG' OR t.category = 'URGENTE' OR t.category = 'CRITICO')")
  long countUrgentOpen();
}
