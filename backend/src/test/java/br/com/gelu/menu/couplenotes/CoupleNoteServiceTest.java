package br.com.gelu.menu.couplenotes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.realtime.RealtimeEventPublisher;
import br.com.gelu.menu.couplenotes.dto.CoupleNoteResponse;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMemberRepository;
import br.com.gelu.menu.family.FamilyRepository;
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
class CoupleNoteServiceTest {

  @Mock private CoupleNoteRepository noteRepository;
  @Mock private FamilyRepository familyRepository;
  @Mock private FamilyMemberRepository familyMemberRepository;
  @Mock private UserRepository userRepository;
  @Mock private RealtimeEventPublisher eventPublisher;

  @InjectMocks private CoupleNoteService service;

  private UUID authorId;
  private UUID partnerId;
  private UUID familyId;
  private UUID noteId;
  private Family family;
  private User author;
  private User partner;
  private CoupleNote note;

  @BeforeEach
  void setUp() {
    authorId = UUID.randomUUID();
    partnerId = UUID.randomUUID();
    familyId = UUID.randomUUID();
    noteId = UUID.randomUUID();

    author = new User("Luan", "luan@example.com", "hash");
    ReflectionTestUtils.setField(author, "id", authorId);

    partner = new User("Geovana", "ge@example.com", "hash");
    ReflectionTestUtils.setField(partner, "id", partnerId);

    family = new Family("Casal GeLu", authorId);
    ReflectionTestUtils.setField(family, "id", familyId);

    note = new CoupleNote(family, author, "Te Amo", "RECADO", "yellow", true);
    ReflectionTestUtils.setField(note, "id", noteId);
  }

  @Test
  void shouldAllowPartnerToAcknowledgeNote() {
    when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));
    when(familyMemberRepository.existsByFamilyIdAndUserId(familyId, partnerId)).thenReturn(true);
    when(userRepository.findById(partnerId)).thenReturn(Optional.of(partner));
    when(noteRepository.save(any(CoupleNote.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    CoupleNoteResponse res = service.acknowledgeNote(partnerId, noteId);

    assertThat(res.acknowledgedAt()).isNotNull();
    assertThat(res.acknowledgedByName()).isEqualTo("Geovana");
    verify(noteRepository).save(note);
  }

  @Test
  void shouldRejectAuthorAcknowledgingOwnNote() {
    when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));
    when(familyMemberRepository.existsByFamilyIdAndUserId(familyId, authorId)).thenReturn(true);

    assertThatThrownBy(() -> service.acknowledgeNote(authorId, noteId))
        .isInstanceOf(BadRequestException.class)
        .hasMessageContaining("O autor do recado não pode marcar como lido");
  }
}
