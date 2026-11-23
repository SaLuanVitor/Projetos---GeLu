package br.com.gelu.menu.family;

import br.com.gelu.menu.admin.AdminService;
import br.com.gelu.menu.audit.AuditAction;
import br.com.gelu.menu.audit.AuditLogService;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.family.dto.AddFamilyMemberRequest;
import br.com.gelu.menu.family.dto.CreateFamilyInviteRequest;
import br.com.gelu.menu.family.dto.CreateFamilyRequest;
import br.com.gelu.menu.family.dto.FamilyInviteResponse;
import br.com.gelu.menu.family.dto.FamilyMemberEvolutionDto;
import br.com.gelu.menu.family.dto.FamilyResponse;
import br.com.gelu.menu.family.dto.FamilyWeightHistoryResponse;
import br.com.gelu.menu.family.dto.UpdateFamilyRequest;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import br.com.gelu.menu.users.WeightHistoryRepository;
import br.com.gelu.menu.users.dto.WeightHistoryItem;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyService {

  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final FamilyInviteRepository familyInviteRepository;
  private final UserRepository userRepository;
  private final WeightHistoryRepository weightHistoryRepository;
  private final AuditLogService auditLogService;
  private final AdminService adminService;

  public FamilyService(
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      FamilyInviteRepository familyInviteRepository,
      UserRepository userRepository,
      WeightHistoryRepository weightHistoryRepository,
      AuditLogService auditLogService,
      AdminService adminService) {
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.familyInviteRepository = familyInviteRepository;
    this.userRepository = userRepository;
    this.weightHistoryRepository = weightHistoryRepository;
    this.auditLogService = auditLogService;
    this.adminService = adminService;
  }

  @Transactional(readOnly = true)
  public List<FamilyResponse> listFamilies(UUID currentUserId) {
    return familyRepository.findAllByMemberUserId(currentUserId).stream()
        .map(FamilyResponse::from)
        .toList();
  }

  @Transactional(readOnly = true)
  public FamilyResponse getFamily(UUID currentUserId, UUID familyId) {
    Family family = findFamilyWithMembers(familyId);
    ensureMember(family, currentUserId);
    return FamilyResponse.from(family);
  }

  @Transactional
  public FamilyResponse createFamily(UUID currentUserId, CreateFamilyRequest request) {
    if (adminService.isSuperAdmin(currentUserId)) {
      throw new ForbiddenException(
          "A conta Super Admin é exclusiva para governança e não pode criar famílias operacionais.");
    }

    User owner =
        userRepository
            .findById(currentUserId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = new Family(request.name().trim(), currentUserId);
    FamilyMember ownerMember = new FamilyMember(family, owner, FamilyRole.ADMIN);
    family.addMember(ownerMember);

    Family saved = familyRepository.save(family);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "FAMILY",
          saved.getId().toString(),
          saved.getId(),
          owner.getId(),
          owner.getName(),
          "Criou a família \"" + saved.getName() + "\"");
    }

    return FamilyResponse.from(saved);
  }

  @Transactional
  public FamilyResponse updateFamily(
      UUID currentUserId, UUID familyId, UpdateFamilyRequest request) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember member = ensureMember(family, currentUserId);

    if (member.getRole() == FamilyRole.VIEWER) {
      throw new ForbiddenException("Viewers cannot update family details");
    }

    String oldName = family.getName();
    family.updateName(request.name().trim());
    Family saved = familyRepository.save(family);

    if (auditLogService != null) {
      User currentUser = userRepository.findById(currentUserId).orElse(null);
      String userName = currentUser != null ? currentUser.getName() : "Usuário";
      auditLogService.log(
          AuditAction.UPDATE,
          "FAMILY",
          saved.getId().toString(),
          saved.getId(),
          currentUserId,
          userName,
          "Atualizou o nome da família de \"" + oldName + "\" para \"" + saved.getName() + "\"");
    }

    return FamilyResponse.from(saved);
  }

  @Transactional
  public void deleteFamily(UUID currentUserId, UUID familyId) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember member = ensureMember(family, currentUserId);

    if (member.getRole() != FamilyRole.ADMIN && !family.getOwnerId().equals(currentUserId)) {
      throw new ForbiddenException("Only family admins can delete the family");
    }

    if (auditLogService != null) {
      User currentUser = userRepository.findById(currentUserId).orElse(null);
      String userName = currentUser != null ? currentUser.getName() : "Usuário";
      auditLogService.log(
          AuditAction.DELETE,
          "FAMILY",
          family.getId().toString(),
          family.getId(),
          currentUserId,
          userName,
          "Excluiu a família \"" + family.getName() + "\"");
    }

    familyRepository.delete(family);
  }

  @Transactional
  public FamilyResponse addFamilyMember(
      UUID currentUserId, UUID familyId, AddFamilyMemberRequest request) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember requester = ensureMember(family, currentUserId);

    if (requester.getRole() != FamilyRole.ADMIN) {
      throw new ForbiddenException("Only family admins can add members");
    }

    User targetUser = resolveUser(request.userId());

    boolean alreadyMember =
        family.getMembers().stream().anyMatch(m -> m.getUserId().equals(targetUser.getId()));
    if (alreadyMember) {
      throw new ConflictException("User is already a member of this family");
    }

    FamilyRole role = FamilyRole.fromString(request.role());
    FamilyMember newMember = new FamilyMember(family, targetUser, role);
    family.addMember(newMember);

    Family saved = familyRepository.save(family);

    if (auditLogService != null) {
      User currentUser = userRepository.findById(currentUserId).orElse(null);
      String userName = currentUser != null ? currentUser.getName() : "Usuário";
      auditLogService.log(
          AuditAction.CREATE,
          "FAMILY_MEMBER",
          newMember.getId().toString(),
          family.getId(),
          currentUserId,
          userName,
          "Adicionou " + targetUser.getName() + " como " + role.name());
    }

    return FamilyResponse.from(saved);
  }

  @Transactional
  public FamilyResponse removeFamilyMember(
      UUID currentUserId, UUID familyId, String targetUserIdOrEmail) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember requester = ensureMember(family, currentUserId);
    User targetUser = resolveUser(targetUserIdOrEmail);

    boolean isSelf = currentUserId.equals(targetUser.getId());
    boolean isAdmin = requester.getRole() == FamilyRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException("Only family admins can remove other members");
    }

    if (family.getOwnerId().equals(targetUser.getId())) {
      throw new BadRequestException("Cannot remove the family owner");
    }

    family.removeMember(targetUser.getId());
    Family saved = familyRepository.save(family);

    if (auditLogService != null) {
      User currentUser = userRepository.findById(currentUserId).orElse(null);
      String userName = currentUser != null ? currentUser.getName() : "Usuário";
      auditLogService.log(
          AuditAction.DELETE,
          "FAMILY_MEMBER",
          targetUser.getId().toString(),
          family.getId(),
          currentUserId,
          userName,
          "Removeu " + targetUser.getName() + " da família");
    }

    return FamilyResponse.from(saved);
  }

  @Transactional
  public FamilyInviteResponse createInvite(
      UUID currentUserId, UUID familyId, CreateFamilyInviteRequest request) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember currentMember = ensureMember(family, currentUserId);
    if (currentMember.getRole() != FamilyRole.ADMIN) {
      throw new ForbiddenException("Only family ADMINs can send invites");
    }

    String email = request.invitedEmail().trim().toLowerCase();

    // Verifica se já é membro
    boolean alreadyMember =
        family.getMembers().stream().anyMatch(m -> email.equalsIgnoreCase(m.getUser().getEmail()));
    if (alreadyMember) {
      throw new ConflictException("User is already a member of this family");
    }

    // Se já tiver convite pendente, cancela anterior
    familyInviteRepository
        .findPendingByFamilyIdAndEmail(familyId, email)
        .ifPresent(FamilyInvite::cancel);

    User currentUser =
        userRepository
            .findById(currentUserId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    String token =
        UUID.randomUUID().toString().replace("-", "")
            + UUID.randomUUID().toString().replace("-", "");
    Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);
    FamilyRole role = FamilyRole.fromString(request.role());

    FamilyInvite invite = new FamilyInvite(family, email, currentUser, role, token, expiresAt);
    FamilyInvite saved = familyInviteRepository.save(invite);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.CREATE,
          "FAMILY_INVITE",
          saved.getId().toString(),
          family.getId(),
          currentUserId,
          currentUser.getName(),
          "Enviou convite para " + email + " com papel " + role.name());
    }

    return FamilyInviteResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public List<FamilyInviteResponse> listPendingInvites(UUID currentUserId, UUID familyId) {
    Family family = findFamilyWithMembers(familyId);
    ensureMember(family, currentUserId);
    return familyInviteRepository
        .findAllByFamilyIdAndStatus(familyId, FamilyInviteStatus.PENDING)
        .stream()
        .map(FamilyInviteResponse::from)
        .toList();
  }

  @Transactional
  public void cancelInvite(UUID currentUserId, UUID familyId, UUID inviteId) {
    Family family = findFamilyWithMembers(familyId);
    FamilyMember currentMember = ensureMember(family, currentUserId);
    if (currentMember.getRole() != FamilyRole.ADMIN) {
      throw new ForbiddenException("Only family ADMINs can cancel invites");
    }

    FamilyInvite invite =
        familyInviteRepository
            .findById(inviteId)
            .orElseThrow(() -> new NotFoundException("Invite not found"));

    if (!invite.getFamily().getId().equals(familyId)) {
      throw new BadRequestException("Invite does not belong to this family");
    }

    invite.cancel();
    familyInviteRepository.save(invite);

    if (auditLogService != null) {
      User currentUser = userRepository.findById(currentUserId).orElse(null);
      String userName = currentUser != null ? currentUser.getName() : "Usuário";
      auditLogService.log(
          AuditAction.DELETE,
          "FAMILY_INVITE",
          invite.getId().toString(),
          family.getId(),
          currentUserId,
          userName,
          "Cancelou convite para " + invite.getInvitedEmail());
    }
  }

  @Transactional(readOnly = true)
  public FamilyInviteResponse getInviteByToken(String token) {
    FamilyInvite invite =
        familyInviteRepository
            .findByToken(token)
            .orElseThrow(() -> new NotFoundException("Invite not found or invalid token"));

    if (invite.getStatus() == FamilyInviteStatus.PENDING && invite.isExpired()) {
      invite.expire();
    }

    return FamilyInviteResponse.from(invite);
  }

  @Transactional
  public FamilyResponse acceptInvite(UUID currentUserId, String token) {
    if (adminService.isSuperAdmin(currentUserId)) {
      throw new ForbiddenException(
          "A conta Super Admin é exclusiva para governança e não pode ingressar em famílias operacionais.");
    }

    FamilyInvite invite =
        familyInviteRepository
            .findByToken(token)
            .orElseThrow(() -> new NotFoundException("Invite not found or invalid token"));

    if (invite.getStatus() != FamilyInviteStatus.PENDING || invite.isExpired()) {
      if (invite.isExpired()) {
        invite.expire();
        familyInviteRepository.save(invite);
      }
      throw new BadRequestException("This invite is no longer valid or has expired");
    }

    User currentUser =
        userRepository
            .findById(currentUserId)
            .orElseThrow(() -> new NotFoundException("User not found"));

    Family family = findFamilyWithMembers(invite.getFamily().getId());

    boolean alreadyMember =
        family.getMembers().stream().anyMatch(m -> m.getUserId().equals(currentUserId));
    if (alreadyMember) {
      invite.accept();
      familyInviteRepository.save(invite);
      return FamilyResponse.from(family);
    }

    FamilyMember newMember = new FamilyMember(family, currentUser, invite.getRole());
    family.addMember(newMember);
    Family saved = familyRepository.save(family);

    invite.accept();
    familyInviteRepository.save(invite);

    if (auditLogService != null) {
      auditLogService.log(
          AuditAction.UPDATE,
          "FAMILY_INVITE",
          invite.getId().toString(),
          family.getId(),
          currentUserId,
          currentUser.getName(),
          currentUser.getName() + " aceitou o convite e entrou na família");
    }

    return FamilyResponse.from(saved);
  }

  @Transactional
  public void rejectInvite(UUID currentUserId, String token) {
    FamilyInvite invite =
        familyInviteRepository
            .findByToken(token)
            .orElseThrow(() -> new NotFoundException("Invite not found or invalid token"));

    if (invite.getStatus() == FamilyInviteStatus.PENDING) {
      invite.reject();
      familyInviteRepository.save(invite);

      if (auditLogService != null) {
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        String userName = currentUser != null ? currentUser.getName() : "Usuário";
        auditLogService.log(
            AuditAction.UPDATE,
            "FAMILY_INVITE",
            invite.getId().toString(),
            invite.getFamily().getId(),
            currentUserId,
            userName,
            userName + " recusou o convite para a família " + invite.getFamily().getName());
      }
    }
  }

  @Transactional(readOnly = true)
  public FamilyWeightHistoryResponse getFamilyWeightHistory(UUID requestingUserId, UUID familyId) {
    Family family = findFamilyWithMembers(familyId);
    ensureMember(family, requestingUserId);

    List<FamilyMemberEvolutionDto> members =
        family.getMembers().stream()
            .map(
                member -> {
                  User user = member.getUser();
                  List<WeightHistoryItem> history =
                      weightHistoryRepository
                          .findByUserIdOrderByRecordedAtDesc(user.getId())
                          .stream()
                          .map(
                              wh ->
                                  new WeightHistoryItem(
                                      wh.getId(),
                                      wh.getWeightKg(),
                                      wh.getRecordedAt(),
                                      wh.getCreatedAt()))
                          .toList();

                  return new FamilyMemberEvolutionDto(
                      user.getId().toString(),
                      user.getName(),
                      user.getEmail(),
                      user.getCurrentWeight(),
                      member.getRole().name(),
                      history);
                })
            .toList();

    return new FamilyWeightHistoryResponse(family.getId().toString(), family.getName(), members);
  }

  private Family findFamilyWithMembers(UUID familyId) {
    return familyRepository
        .findByIdWithMembers(familyId)
        .orElseThrow(() -> new NotFoundException("Family not found"));
  }

  private FamilyMember ensureMember(Family family, UUID userId) {
    return family.getMembers().stream()
        .filter(m -> m.getUserId().equals(userId))
        .findFirst()
        .orElseThrow(() -> new ForbiddenException("You are not a member of this family"));
  }

  private User resolveUser(String identifier) {
    if (identifier == null || identifier.isBlank()) {
      throw new BadRequestException("User identifier is required");
    }

    try {
      UUID uuid = UUID.fromString(identifier.trim());
      return userRepository
          .findById(uuid)
          .or(() -> userRepository.findByEmail(identifier.trim()))
          .orElseThrow(() -> new NotFoundException("User not found with id: " + identifier));
    } catch (IllegalArgumentException e) {
      return userRepository
          .findByEmail(identifier.trim())
          .orElseThrow(() -> new NotFoundException("User not found with email: " + identifier));
    }
  }
}
