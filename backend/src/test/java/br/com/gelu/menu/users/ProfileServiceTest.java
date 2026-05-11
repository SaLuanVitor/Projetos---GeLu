package br.com.gelu.menu.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.gelu.menu.common.exception.UnauthorizedException;
import br.com.gelu.menu.users.dto.CreateWeightRecordRequest;
import br.com.gelu.menu.users.dto.UpdateProfileRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class ProfileServiceTest {

  private final UserRepository userRepository = org.mockito.Mockito.mock(UserRepository.class);
  private final WeightHistoryRepository weightHistoryRepository =
      org.mockito.Mockito.mock(WeightHistoryRepository.class);
  private final ProfileService profileService =
      new ProfileService(userRepository, weightHistoryRepository);

  @Test
  void shouldLoadProfile() {
    User user = new User("Luan", "luan@example.com", "password-hash");
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

    var response = profileService.getProfile(user.getId());

    assertThat(response.id()).isEqualTo(user.getId());
    assertThat(response.email()).isEqualTo("luan@example.com");
  }

  @Test
  void shouldUpdateProfile() {
    User user = new User("Luan", "luan@example.com", "password-hash");
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

    var response =
        profileService.updateProfile(
            user.getId(),
            new UpdateProfileRequest(
                " Luan Vilar ",
                LocalDate.of(1998, 5, 10),
                new BigDecimal("178.50"),
                "MASCULINO",
                "Emagrecer",
                new BigDecimal("1800.00"),
                new BigDecimal("2200.00")));

    assertThat(response.name()).isEqualTo("Luan Vilar");
    assertThat(response.birthDate()).isEqualTo(LocalDate.of(1998, 5, 10));
    assertThat(response.heightCm()).isEqualByComparingTo("178.50");
    assertThat(response.goal()).isEqualTo("Emagrecer");
  }

  @Test
  void shouldCreateWeightRecordAndUpdateCurrentWeight() {
    User user = new User("Luan", "luan@example.com", "password-hash");
    LocalDateTime recordedAt = LocalDateTime.of(2026, 5, 10, 8, 30);
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(weightHistoryRepository.save(any(WeightHistory.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var response =
        profileService.createWeightRecord(
            user.getId(), new CreateWeightRecordRequest(new BigDecimal("82.30"), recordedAt));

    assertThat(response.weightKg()).isEqualByComparingTo("82.30");
    assertThat(response.recordedAt()).isEqualTo(recordedAt);
    assertThat(user.getCurrentWeight()).isEqualByComparingTo("82.30");
  }

  @Test
  void shouldListWeightHistoryNewestFirstFromRepository() {
    User user = new User("Luan", "luan@example.com", "password-hash");
    WeightHistory recent =
        new WeightHistory(
            user.getId(), new BigDecimal("82.30"), LocalDateTime.of(2026, 5, 10, 8, 30));
    WeightHistory old =
        new WeightHistory(
            user.getId(), new BigDecimal("84.00"), LocalDateTime.of(2026, 4, 10, 8, 30));
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(weightHistoryRepository.findByUserIdOrderByRecordedAtDesc(user.getId()))
        .thenReturn(List.of(recent, old));

    var response = profileService.listWeightHistory(user.getId());

    assertThat(response)
        .extracting("weightKg")
        .containsExactly(new BigDecimal("82.30"), new BigDecimal("84.00"));
  }

  @Test
  void shouldRejectMissingUser() {
    java.util.UUID userId = java.util.UUID.randomUUID();
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> profileService.getProfile(userId))
        .isInstanceOf(UnauthorizedException.class)
        .hasMessage("Authentication required");
  }
}
