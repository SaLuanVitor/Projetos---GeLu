package br.com.gelu.menu.ai.lgpd;

import br.com.gelu.menu.admin.AiUsageLogRepository;
import br.com.gelu.menu.ai.learning.UserDietaryHabit;
import br.com.gelu.menu.ai.learning.UserDietaryHabitRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LgpdLifecycleServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserDietaryHabitRepository habitRepository;

    @Mock
    private AiUsageLogRepository aiUsageLogRepository;

    private LgpdLifecycleService lgpdService;

    @BeforeEach
    void setUp() {
        lgpdService = new LgpdLifecycleService(userRepository, habitRepository, aiUsageLogRepository);
    }

    @Test
    @DisplayName("Deve exportar dados do usuário em conformidade com o Artigo 18 da LGPD")
    void testExportUserData() {
        User user = new User("Luan Vitor", "luan@gelu.com.br", "password-hash");
        UUID userId = user.getId();

        UserDietaryHabit habit = UserDietaryHabit.builder()
                .userId(userId)
                .habitProfile("{\"foodAffinity\":{\"arroz\":0.5}}")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(habitRepository.findById(userId)).thenReturn(Optional.of(habit));
        when(aiUsageLogRepository.findAllByUserId(userId)).thenReturn(Collections.emptyList());

        var report = lgpdService.exportUserData(userId);

        assertThat(report).isNotNull();
        assertThat(report.userName()).isEqualTo("Luan Vitor");
        assertThat(report.userEmail()).isEqualTo("luan@gelu.com.br");
        assertThat(report.learnedHabitsJson()).contains("arroz");
        assertThat(report.legalBasis()).contains("Artigo 18");
    }

    @Test
    @DisplayName("Deve purgar hábitos e anonimizar logs em conformidade com o Artigo 16 da LGPD")
    void testPurgeUserData() {
        UUID userId = UUID.randomUUID();
        when(habitRepository.existsById(userId)).thenReturn(true);

        var result = lgpdService.purgeUserData(userId);

        assertThat(result.habitsPurged()).isTrue();
        assertThat(result.logsAnonymized()).isTrue();
        verify(habitRepository).deleteById(userId);
        verify(aiUsageLogRepository).anonymizeByUserId(userId);
    }
}
