package br.com.gelu.menu.admin;

import br.com.gelu.menu.admin.dto.CreateSupportTicketRequest;
import br.com.gelu.menu.admin.dto.PublicSupportSettingsResponse;
import br.com.gelu.menu.admin.dto.SupportTicketResponse;
import br.com.gelu.menu.audit.AuditAction;
import br.com.gelu.menu.audit.AuditLogService;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportService {

  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final SupportTicketRepository supportTicketRepository;
  private final SystemSettingRepository systemSettingRepository;
  private final AuditLogService auditLogService;

  public SupportService(
      UserRepository userRepository,
      FamilyRepository familyRepository,
      SupportTicketRepository supportTicketRepository,
      SystemSettingRepository systemSettingRepository,
      AuditLogService auditLogService) {
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.supportTicketRepository = supportTicketRepository;
    this.systemSettingRepository = systemSettingRepository;
    this.auditLogService = auditLogService;
  }

  @Transactional(readOnly = true)
  public PublicSupportSettingsResponse getPublicSettings() {
    String email = systemSettingRepository.findByKey("support_email").map(SystemSetting::getValue).orElse("suporte@gelu.com.br");
    String phone = systemSettingRepository.findByKey("support_phone").map(SystemSetting::getValue).orElse("(11) 99999-9999");
    String whatsapp = systemSettingRepository.findByKey("support_whatsapp").map(SystemSetting::getValue).orElse("5511999999999");
    String hours = systemSettingRepository.findByKey("support_hours").map(SystemSetting::getValue).orElse("Segunda a Sexta, das 09:00 às 18:00");
    String banner = systemSettingRepository.findByKey("system_broadcast_banner").map(SystemSetting::getValue).orElse("");

    return new PublicSupportSettingsResponse(email, phone, whatsapp, hours, banner);
  }

  @Transactional(readOnly = true)
  public List<SupportTicketResponse> getMyTickets(UUID userId) {
    // Busca os membros da família do usuário para permitir acompanhamento familiar
    List<Family> families = familyRepository.findAllByMemberUserId(userId);
    Set<UUID> memberIds = new HashSet<>();
    memberIds.add(userId);
    for (Family f : families) {
      if (f.getMembers() != null) {
        f.getMembers().forEach(m -> memberIds.add(m.getUser().getId()));
      }
    }

    List<SupportTicket> tickets = supportTicketRepository.findAllByUserIds(new ArrayList<>(memberIds));
    return tickets.stream().map(SupportTicketResponse::from).toList();
  }

  @Transactional
  public SupportTicketResponse createTicket(UUID userId, CreateSupportTicketRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    SupportTicket ticket =
        new SupportTicket(user, request.subject(), request.category(), request.description());
    SupportTicket saved = supportTicketRepository.save(ticket);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "SUPPORT_TICKET",
          saved.getId().toString(),
          null,
          user.getId(),
          user.getName(),
          "Abriu chamado de suporte: \"" + saved.getSubject() + "\" (" + saved.getCategory() + ")");
    }

    return SupportTicketResponse.from(saved);
  }
}
