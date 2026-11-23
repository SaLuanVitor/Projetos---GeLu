package br.com.gelu.menu.couplenotes;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.common.realtime.RealtimeEventPublisher;
import br.com.gelu.menu.couplenotes.dto.CoupleNoteResponse;
import br.com.gelu.menu.couplenotes.dto.CreateCoupleNoteRequest;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMemberRepository;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoupleNoteService {

  private final CoupleNoteRepository noteRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final UserRepository userRepository;
  private final RealtimeEventPublisher eventPublisher;

  public CoupleNoteService(
      CoupleNoteRepository noteRepository,
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      UserRepository userRepository,
      RealtimeEventPublisher eventPublisher) {
    this.noteRepository = noteRepository;
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional(readOnly = true)
  public List<CoupleNoteResponse> listNotes(UUID userId, UUID familyId, boolean onlyActive) {
    ensureFamilyMember(familyId, userId);
    List<CoupleNote> notes =
        onlyActive
            ? noteRepository.findActiveByFamilyIdAndVisible(familyId, userId)
            : noteRepository.findAllByFamilyIdAndVisible(familyId, userId);
    return notes.stream().map(CoupleNoteResponse::from).toList();
  }

  @Transactional
  public CoupleNoteResponse createNote(UUID userId, CreateCoupleNoteRequest request) {
    UUID familyId = request.familyId();
    if (familyId == null) {
      familyId =
          familyRepository.findAllByMemberUserId(userId).stream()
              .findFirst()
              .map(Family::getId)
              .orElseThrow(
                  () -> new NotFoundException("No family found for user. Create a family first."));
    }

    ensureFamilyMember(familyId, userId);

    Family family =
        familyRepository
            .findById(familyId)
            .orElseThrow(() -> new NotFoundException("Family not found"));
    User author =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

    User recipient = null;
    if (request.recipientUserId() != null) {
      recipient =
          userRepository
              .findById(request.recipientUserId())
              .orElseThrow(() -> new NotFoundException("Recipient user not found"));
      ensureFamilyMember(familyId, recipient.getId());
    }

    boolean pinned = request.pinned() == null || request.pinned();
    CoupleNote note =
        new CoupleNote(
            family,
            author,
            recipient,
            request.content().trim(),
            request.category(),
            request.color(),
            pinned);

    CoupleNoteResponse response = CoupleNoteResponse.from(noteRepository.save(note));
    eventPublisher.publishFamilyEvent(familyId, "COUPLE_NOTE_CREATED", response);
    return response;
  }

  @Transactional
  public CoupleNoteResponse acknowledgeNote(UUID userId, UUID noteId) {
    CoupleNote note =
        noteRepository.findById(noteId).orElseThrow(() -> new NotFoundException("Note not found"));
    ensureFamilyMember(note.getFamily().getId(), userId);

    if (note.getAuthor().getId().equals(userId)) {
      throw new BadRequestException("O autor do recado não pode marcar como lido o próprio bilhete.");
    }

    User user =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
    note.acknowledge(user);

    CoupleNoteResponse response = CoupleNoteResponse.from(noteRepository.save(note));
    eventPublisher.publishFamilyEvent(note.getFamily().getId(), "COUPLE_NOTE_ACKNOWLEDGED", response);
    return response;
  }

  @Transactional
  public CoupleNoteResponse resolveNote(UUID userId, UUID noteId, boolean resolved) {
    CoupleNote note =
        noteRepository.findById(noteId).orElseThrow(() -> new NotFoundException("Note not found"));
    ensureFamilyMember(note.getFamily().getId(), userId);

    note.resolve(resolved);
    CoupleNoteResponse response = CoupleNoteResponse.from(noteRepository.save(note));
    eventPublisher.publishFamilyEvent(note.getFamily().getId(), "COUPLE_NOTE_RESOLVED", response);
    return response;
  }

  @Transactional
  public void deleteNote(UUID userId, UUID noteId) {
    CoupleNote note =
        noteRepository.findById(noteId).orElseThrow(() -> new NotFoundException("Note not found"));
    ensureFamilyMember(note.getFamily().getId(), userId);

    UUID familyId = note.getFamily().getId();
    noteRepository.delete(note);
    eventPublisher.publishFamilyEvent(familyId, "COUPLE_NOTE_DELETED", Map.of("id", noteId.toString()));
  }

  private void ensureFamilyMember(UUID familyId, UUID userId) {
    if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
      throw new ForbiddenException("You are not a member of this family");
    }
  }
}
