package br.com.gelu.menu.ai.learning;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserHabitLearningServiceTest {

    @Mock
    private UserDietaryHabitRepository habitRepository;

    @Mock
    private AiFeedbackRepository aiFeedbackRepository;

    private ObjectMapper objectMapper;
    private UserHabitLearningService learningService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        learningService = new UserHabitLearningService(habitRepository, aiFeedbackRepository, objectMapper);
    }

    @Test
    @DisplayName("Deve registrar feedback de refeição aceita e amortecer afinidades")
    void testRecordFeedbackAccepted() {
        UUID userId = UUID.randomUUID();
        when(habitRepository.findById(userId)).thenReturn(Optional.empty());

        var feedback = new UserHabitLearningService.UserFeedbackRequest(
                "Frango com Arroz",
                List.of("150g peito de frango", "3 colheres arroz"),
                true,
                5.0,
                null
        );

        learningService.recordFeedback(userId, feedback);

        verify(aiFeedbackRepository).save(any(AiFeedback.class));
        verify(habitRepository).save(any(UserDietaryHabit.class));
    }

    @Test
    @DisplayName("Deve registrar feedback negativo com motivo e incluir no contexto de aprendizado")
    void testRecordNegativeFeedbackWithCorrectionNotes() {
        UUID userId = UUID.randomUUID();
        when(habitRepository.findById(userId)).thenReturn(Optional.empty());

        var feedback = new UserHabitLearningService.UserFeedbackRequest(
                "FOOD_VISION",
                "Prato de Teste",
                List.of("carne bovina"),
                false,
                1.0,
                "Identificou carne bovina mas era soja texturizada",
                "{}"
        );

        learningService.recordFeedback(userId, feedback);

        verify(aiFeedbackRepository).save(any(AiFeedback.class));
        verify(habitRepository).save(any(UserDietaryHabit.class));
    }

    @Test
    @DisplayName("Deve gerar prompt contextual few-shot baseado nos hábitos aprendidos e correções")
    void testGetFewShotPromptContext() {
        UUID userId = UUID.randomUUID();
        String json = "{\"foodAffinity\":{\"peito de frango\":0.6,\"arroz integral\":0.4,\"açúcar\":-0.5},\"typicalPortionsGrams\":{},\"recentCorrections\":[\"Evitar coentro em excesso\"],\"totalInteractions\":5}";
        UserDietaryHabit habit = UserDietaryHabit.builder()
                .userId(userId)
                .habitProfile(json)
                .version(2)
                .build();

        when(habitRepository.findById(userId)).thenReturn(Optional.of(habit));

        String promptContext = learningService.getFewShotPromptContext(userId);

        assertThat(promptContext).contains("PREFERÊNCIAS APRENDIDAS DO USUÁRIO");
        assertThat(promptContext).contains("peito de frango");
        assertThat(promptContext).contains("açúcar");
        assertThat(promptContext).contains("Evitar coentro em excesso");
    }
}
