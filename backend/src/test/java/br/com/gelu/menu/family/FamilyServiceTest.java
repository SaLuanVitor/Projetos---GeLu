package br.com.gelu.menu.family;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.admin.AdminService;
import br.com.gelu.menu.audit.AuditLogService;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.family.dto.AddFamilyMemberRequest;
import br.com.gelu.menu.family.dto.CreateFamilyRequest;
import br.com.gelu.menu.family.dto.FamilyResponse;
import br.com.gelu.menu.family.dto.UpdateFamilyRequest;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FamilyServiceTest {

  @Mock private FamilyRepository familyRepository;
  @Mock private FamilyMemberRepository familyMemberRepository;
  @Mock private UserRepository userRepository;
  @Mock private AuditLogService auditLogService;
  @Mock private AdminService adminService;

  @InjectMocks private FamilyService familyService;

  private User owner;
  private User memberUser;
  private UUID ownerId;
  private UUID memberId;

  @BeforeEach
  void setUp() {
    ownerId = UUID.randomUUID();
    memberId = UUID.randomUUID();

    owner = new User("Luan", "luan@example.com", "hash");
    ReflectionTestUtils.setField(owner, "id", ownerId);

    memberUser = new User("Geovana", "geovana@example.com", "hash");
    ReflectionTestUtils.setField(memberUser, "id", memberId);
  }

  @Test
  void shouldRejectFamilyCreationBySuperAdmin() {
    when(adminService.isSuperAdmin(ownerId)).thenReturn(true);

    assertThatThrownBy(
            () -> familyService.createFamily(ownerId, new CreateFamilyRequest("Família Admin")))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("A conta Super Admin é exclusiva para governança");
  }

  @Test
  void shouldCreateFamilyWithOwnerAsAdmin() {
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
    when(familyRepository.save(any(Family.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    FamilyResponse response =
        familyService.createFamily(ownerId, new CreateFamilyRequest("Família Gelu"));

    assertThat(response.name()).isEqualTo("Família Gelu");
    assertThat(response.ownerId()).isEqualTo(ownerId.toString());
    assertThat(response.members()).hasSize(1);
    assertThat(response.members().get(0).role()).isEqualTo("ADMIN");
  }

  @Test
  void shouldRejectUpdateFromViewer() {
    Family family = new Family("Família", ownerId);
    FamilyMember viewer = new FamilyMember(family, memberUser, FamilyRole.VIEWER);
    family.addMember(viewer);

    when(familyRepository.findByIdWithMembers(family.getId())).thenReturn(Optional.of(family));

    assertThatThrownBy(
            () ->
                familyService.updateFamily(
                    memberId, family.getId(), new UpdateFamilyRequest("Novo Nome")))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("Viewers cannot update family details");
  }

  @Test
  void shouldRejectDeleteFromNonAdmin() {
    Family family = new Family("Família", ownerId);
    FamilyMember editor = new FamilyMember(family, memberUser, FamilyRole.EDITOR);
    family.addMember(editor);

    when(familyRepository.findByIdWithMembers(family.getId())).thenReturn(Optional.of(family));

    assertThatThrownBy(() -> familyService.deleteFamily(memberId, family.getId()))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("Only family admins can delete the family");
  }

  @Test
  void shouldRejectAddingAlreadyExistingMember() {
    Family family = new Family("Família", ownerId);
    FamilyMember admin = new FamilyMember(family, owner, FamilyRole.ADMIN);
    FamilyMember member = new FamilyMember(family, memberUser, FamilyRole.VIEWER);
    family.addMember(admin);
    family.addMember(member);

    when(familyRepository.findByIdWithMembers(family.getId())).thenReturn(Optional.of(family));
    when(userRepository.findByEmail("geovana@example.com")).thenReturn(Optional.of(memberUser));

    assertThatThrownBy(
            () ->
                familyService.addFamilyMember(
                    ownerId,
                    family.getId(),
                    new AddFamilyMemberRequest("geovana@example.com", "MEMBER")))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("User is already a member");
  }

  @Test
  void shouldRejectRemovingFamilyOwner() {
    Family family = new Family("Família", ownerId);
    FamilyMember admin = new FamilyMember(family, owner, FamilyRole.ADMIN);
    family.addMember(admin);

    when(familyRepository.findByIdWithMembers(family.getId())).thenReturn(Optional.of(family));
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));

    assertThatThrownBy(
            () -> familyService.removeFamilyMember(ownerId, family.getId(), ownerId.toString()))
        .isInstanceOf(BadRequestException.class)
        .hasMessageContaining("Cannot remove the family owner");
  }
}
