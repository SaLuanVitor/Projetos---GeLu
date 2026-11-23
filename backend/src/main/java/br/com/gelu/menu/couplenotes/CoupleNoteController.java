package br.com.gelu.menu.couplenotes;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.couplenotes.dto.CoupleNoteResponse;
import br.com.gelu.menu.couplenotes.dto.CreateCoupleNoteRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/couple-notes")
public class CoupleNoteController {

  private final CoupleNoteService noteService;

  public CoupleNoteController(CoupleNoteService noteService) {
    this.noteService = noteService;
  }

  @GetMapping
  public ApiResponse<List<CoupleNoteResponse>> listNotes(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam UUID familyId,
      @RequestParam(defaultValue = "false") boolean activeOnly) {
    return ApiResponse.ok(
        noteService.listNotes(user.id(), familyId, activeOnly), "Notes loaded successfully");
  }

  @PostMapping
  public ApiResponse<CoupleNoteResponse> createNote(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateCoupleNoteRequest request) {
    return ApiResponse.ok(noteService.createNote(user.id(), request), "Note created successfully");
  }

  @PostMapping("/{id}/acknowledge")
  public ApiResponse<CoupleNoteResponse> acknowledgeNote(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return ApiResponse.ok(
        noteService.acknowledgeNote(user.id(), id), "Note acknowledged successfully");
  }

  @PutMapping("/{id}/resolve")
  public ApiResponse<CoupleNoteResponse> resolveNote(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "true") boolean resolved) {
    return ApiResponse.ok(
        noteService.resolveNote(user.id(), id, resolved), "Note resolution updated successfully");
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteNote(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    noteService.deleteNote(user.id(), id);
    return ApiResponse.ok(null, "Note deleted successfully");
  }
}
