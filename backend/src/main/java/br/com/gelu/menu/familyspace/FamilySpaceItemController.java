package br.com.gelu.menu.familyspace;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.familyspace.dto.CreateFamilySpaceItemRequest;
import br.com.gelu.menu.familyspace.dto.FamilySpaceItemResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/family-spaces")
public class FamilySpaceItemController {

  private final FamilySpaceItemService spaceItemService;

  public FamilySpaceItemController(FamilySpaceItemService spaceItemService) {
    this.spaceItemService = spaceItemService;
  }

  @GetMapping
  public ApiResponse<List<FamilySpaceItemResponse>> listItems(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam UUID familyId,
      @RequestParam(required = false) String category) {
    List<FamilySpaceItemResponse> items =
        spaceItemService.listItems(user.id(), familyId, category);
    return ApiResponse.ok(items, "Itens do espaço da família carregados com sucesso");
  }

  @PostMapping
  public ApiResponse<FamilySpaceItemResponse> createItem(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateFamilySpaceItemRequest request) {
    FamilySpaceItemResponse response = spaceItemService.createItem(user.id(), request);
    return ApiResponse.ok(response, "Item do espaço criado com sucesso");
  }

  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteItem(
      @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    spaceItemService.deleteItem(user.id(), id);
    return ApiResponse.ok(null, "Item do espaço excluído com sucesso");
  }
}
