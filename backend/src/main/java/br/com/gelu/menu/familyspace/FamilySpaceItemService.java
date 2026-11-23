package br.com.gelu.menu.familyspace;

import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.common.realtime.RealtimeEventPublisher;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMemberRepository;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.familyspace.dto.CreateFamilySpaceItemRequest;
import br.com.gelu.menu.familyspace.dto.FamilySpaceItemResponse;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilySpaceItemService {

  private final FamilySpaceItemRepository itemRepository;
  private final FamilyRepository familyRepository;
  private final FamilyMemberRepository familyMemberRepository;
  private final UserRepository userRepository;
  private final RealtimeEventPublisher eventPublisher;

  public FamilySpaceItemService(
      FamilySpaceItemRepository itemRepository,
      FamilyRepository familyRepository,
      FamilyMemberRepository familyMemberRepository,
      UserRepository userRepository,
      RealtimeEventPublisher eventPublisher) {
    this.itemRepository = itemRepository;
    this.familyRepository = familyRepository;
    this.familyMemberRepository = familyMemberRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional(readOnly = true)
  public List<FamilySpaceItemResponse> listItems(UUID userId, UUID familyId, String category) {
    ensureFamilyMember(familyId, userId);
    List<FamilySpaceItem> items =
        (category != null && !category.isBlank())
            ? itemRepository.findAllByFamilyIdAndCategory(familyId, category.toUpperCase())
            : itemRepository.findAllByFamilyId(familyId);
    return items.stream().map(FamilySpaceItemResponse::from).toList();
  }

  @Transactional
  public FamilySpaceItemResponse createItem(UUID userId, CreateFamilySpaceItemRequest request) {
    UUID familyId = request.familyId();
    if (familyId == null) {
      familyId =
          familyRepository.findAllByMemberUserId(userId).stream()
              .findFirst()
              .map(Family::getId)
              .orElseThrow(() -> new NotFoundException("No family found for user."));
    }

    ensureFamilyMember(familyId, userId);

    Family family =
        familyRepository
            .findById(familyId)
            .orElseThrow(() -> new NotFoundException("Family not found"));
    User author =
        userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

    boolean pinned = request.pinned() != null && request.pinned();
    int order = request.orderIndex() != null ? request.orderIndex() : 0;

    FamilySpaceItem item =
        new FamilySpaceItem(
            family,
            author,
            request.category(),
            request.title().trim(),
            request.description(),
            request.highlightTag(),
            pinned,
            order);

    FamilySpaceItemResponse response = FamilySpaceItemResponse.from(itemRepository.save(item));
    eventPublisher.publishFamilyEvent(familyId, "FAMILY_SPACE_ITEM_CREATED", response);
    return response;
  }

  @Transactional
  public void deleteItem(UUID userId, UUID itemId) {
    FamilySpaceItem item =
        itemRepository.findById(itemId).orElseThrow(() -> new NotFoundException("Item not found"));
    ensureFamilyMember(item.getFamily().getId(), userId);

    UUID familyId = item.getFamily().getId();
    itemRepository.delete(item);
    eventPublisher.publishFamilyEvent(
        familyId, "FAMILY_SPACE_ITEM_DELETED", Map.of("id", itemId.toString()));
  }

  private void ensureFamilyMember(UUID familyId, UUID userId) {
    if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
      throw new ForbiddenException("You are not a member of this family");
    }
  }
}
