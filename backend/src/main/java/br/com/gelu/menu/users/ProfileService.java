package br.com.gelu.menu.users;

import br.com.gelu.menu.common.exception.UnauthorizedException;
import br.com.gelu.menu.users.dto.CreateWeightRecordRequest;
import br.com.gelu.menu.users.dto.ProfileResponse;
import br.com.gelu.menu.users.dto.UpdateProfileRequest;
import br.com.gelu.menu.users.dto.WeightHistoryItem;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

  private final UserRepository userRepository;
  private final WeightHistoryRepository weightHistoryRepository;

  public ProfileService(
      UserRepository userRepository, WeightHistoryRepository weightHistoryRepository) {
    this.userRepository = userRepository;
    this.weightHistoryRepository = weightHistoryRepository;
  }

  @Transactional(readOnly = true)
  public ProfileResponse getProfile(UUID userId) {
    return toProfileResponse(findActiveUser(userId));
  }

  @Transactional
  public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
    User user = findActiveUser(userId);
    user.updateProfile(
        request.name().trim(),
        request.birthDate(),
        request.heightCm(),
        normalize(request.biologicalSex()),
        normalize(request.goal()),
        request.basalCalories(),
        request.dailyCalorieGoal());
    return toProfileResponse(user);
  }

  @Transactional(readOnly = true)
  public List<WeightHistoryItem> listWeightHistory(UUID userId) {
    findActiveUser(userId);
    return weightHistoryRepository.findByUserIdOrderByRecordedAtDesc(userId).stream()
        .map(this::toWeightHistoryItem)
        .toList();
  }

  @Transactional
  public WeightHistoryItem createWeightRecord(UUID userId, CreateWeightRecordRequest request) {
    User user = findActiveUser(userId);
    WeightHistory weightHistory =
        new WeightHistory(
            userId,
            request.weightKg(),
            request.recordedAt() == null ? LocalDateTime.now() : request.recordedAt());
    WeightHistory saved = weightHistoryRepository.save(weightHistory);
    user.updateCurrentWeight(saved.getWeightKg());
    return toWeightHistoryItem(saved);
  }

  private User findActiveUser(UUID userId) {
    return userRepository
        .findById(userId)
        .filter(User::isActive)
        .orElseThrow(() -> new UnauthorizedException("Authentication required"));
  }

  private ProfileResponse toProfileResponse(User user) {
    return new ProfileResponse(
        user.getId(),
        user.getName(),
        user.getEmail(),
        user.getBirthDate(),
        user.getHeightCm(),
        user.getCurrentWeight(),
        user.getBiologicalSex(),
        user.getGoal(),
        user.getBasalCalories(),
        user.getDailyCalorieGoal(),
        user.isActive(),
        user.getCreatedAt());
  }

  private WeightHistoryItem toWeightHistoryItem(WeightHistory weightHistory) {
    return new WeightHistoryItem(
        weightHistory.getId(),
        weightHistory.getWeightKg(),
        weightHistory.getRecordedAt(),
        weightHistory.getCreatedAt());
  }

  private String normalize(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
