package br.com.gelu.menu.users;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.users.dto.CreateWeightRecordRequest;
import br.com.gelu.menu.users.dto.ProfileResponse;
import br.com.gelu.menu.users.dto.UpdateProfileRequest;
import br.com.gelu.menu.users.dto.WeightHistoryItem;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

  private final ProfileService profileService;

  public ProfileController(ProfileService profileService) {
    this.profileService = profileService;
  }

  @GetMapping("/me")
  public ApiResponse<ProfileResponse> getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(profileService.getProfile(user.id()), "Profile loaded successfully");
  }

  @PutMapping("/me")
  public ApiResponse<ProfileResponse> updateProfile(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody UpdateProfileRequest request) {
    return ApiResponse.ok(
        profileService.updateProfile(user.id(), request), "Profile updated successfully");
  }

  @GetMapping("/weight-history")
  public ApiResponse<List<WeightHistoryItem>> listWeightHistory(
      @AuthenticationPrincipal AuthenticatedUser user) {
    return ApiResponse.ok(
        profileService.listWeightHistory(user.id()), "Weight history loaded successfully");
  }

  @PostMapping("/weight-history")
  public ApiResponse<WeightHistoryItem> createWeightRecord(
      @AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody CreateWeightRecordRequest request) {
    return ApiResponse.ok(
        profileService.createWeightRecord(user.id(), request), "Weight registered successfully");
  }
}
