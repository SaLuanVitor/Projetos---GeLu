package br.com.gelu.menu.ai.learning;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserHabitLearningService {

    private static final Logger log = LoggerFactory.getLogger(UserHabitLearningService.class);

    private static final double ALPHA_DAMPING = 0.20; // Fator de amortecimento exponencial (damping)
    private static final double MAX_SWING_RATIO = 0.50; // Proteção contra envenenamento (máx 50% de variação por passo)

    private final UserDietaryHabitRepository habitRepository;
    private final AiFeedbackRepository aiFeedbackRepository;
    private final ObjectMapper objectMapper;

    public UserHabitLearningService(
            UserDietaryHabitRepository habitRepository,
            AiFeedbackRepository aiFeedbackRepository,
            ObjectMapper objectMapper) {
        this.habitRepository = habitRepository;
        this.aiFeedbackRepository = aiFeedbackRepository;
        this.objectMapper = objectMapper;
    }

    public record LearnedProfile(
            Map<String, Double> foodAffinity, // Score de preferência (-1.0 a +1.0)
            Map<String, Double> typicalPortionsGrams, // Porções típicas calibradas (em gramas)
            List<String> recentCorrections, // Motivos e correções negativas recentes fornecidas pelo usuário
            int totalInteractions,
            LocalDateTime lastLearnedAt
    ) {
        public LearnedProfile(
                Map<String, Double> foodAffinity,
                Map<String, Double> typicalPortionsGrams,
                int totalInteractions,
                LocalDateTime lastLearnedAt) {
            this(foodAffinity, typicalPortionsGrams, new ArrayList<>(), totalInteractions, lastLearnedAt);
        }
    }

    public record UserFeedbackRequest(
            String featureType, // SUGGESTION, FOOD_VISION, FOOD_PARSER, NUTRITION_ESTIMATE
            String mealTitle,
            List<String> ingredients,
            boolean accepted,
            Double rating,
            String correctionNotes,
            String metadata
    ) {
        // Construtor de compatibilidade para chamadas legadas
        public UserFeedbackRequest(
                String mealTitle,
                List<String> ingredients,
                boolean accepted,
                Double rating,
                String correctionNotes) {
            this("SUGGESTION", mealTitle, ingredients, accepted, rating, correctionNotes, "{}");
        }
    }

    @Transactional
    public void recordFeedback(UUID userId, UserFeedbackRequest feedback) {
        if (userId == null || feedback == null) return;

        // 1. Persiste o registro de feedback na tabela ai_feedbacks
        try {
            String feat = feedback.featureType() != null && !feedback.featureType().isBlank()
                    ? feedback.featureType()
                    : "SUGGESTION";
            AiFeedback entityFeedback = new AiFeedback(
                    null,
                    userId,
                    feat,
                    feedback.mealTitle(),
                    feedback.accepted(),
                    feedback.correctionNotes(),
                    feedback.metadata() != null ? feedback.metadata() : "{}",
                    LocalDateTime.now()
            );
            aiFeedbackRepository.save(entityFeedback);
        } catch (Exception e) {
            log.warn("Falha ao salvar AiFeedback na tabela dedicada: {}", e.getMessage());
        }

        // 2. Atualiza o perfil de aprendizado contínuo (JSONB)
        UserDietaryHabit entity = habitRepository.findById(userId)
                .orElseGet(() -> UserDietaryHabit.builder()
                        .userId(userId)
                        .habitProfile("{}")
                        .version(1)
                        .build());

        LearnedProfile current = parseProfile(entity.getHabitProfile());

        Map<String, Double> affinities = new HashMap<>(current.foodAffinity() != null ? current.foodAffinity() : Map.of());
        Map<String, Double> portions = new HashMap<>(current.typicalPortionsGrams() != null ? current.typicalPortionsGrams() : Map.of());
        List<String> corrections = new ArrayList<>(current.recentCorrections() != null ? current.recentCorrections() : Collections.emptyList());

        double deltaAffinity = feedback.accepted() ? 0.3 : -0.3;
        if (feedback.rating() != null) {
            deltaAffinity = (feedback.rating() - 3.0) / 5.0; // rating de 1 a 5 mapeado para [-0.4, +0.4]
        }

        // Aplica amortecimento para cada ingrediente
        if (feedback.ingredients() != null) {
            for (String raw : feedback.ingredients()) {
                String foodKey = sanitizeFoodKey(raw);
                if (foodKey.isBlank()) continue;

                double prevAffinity = affinities.getOrDefault(foodKey, 0.0);
                double targetAffinity = Math.max(-1.0, Math.min(1.0, prevAffinity + deltaAffinity));

                // Anti-drift / Damping: prev * (1 - alpha) + target * alpha
                double updatedAffinity = (prevAffinity * (1.0 - ALPHA_DAMPING)) + (targetAffinity * ALPHA_DAMPING);
                affinities.put(foodKey, Math.round(updatedAffinity * 100.0) / 100.0);
            }
        }

        // Se o feedback for negativo ou houver comentário de correção explicativo, memoriza para refinamento futuro
        if ((!feedback.accepted() || (feedback.rating() != null && feedback.rating() <= 2.0))
                && feedback.correctionNotes() != null
                && !feedback.correctionNotes().isBlank()) {
            String note = feedback.correctionNotes().trim();
            if (!corrections.contains(note)) {
                corrections.add(0, note); // Adiciona no início (mais recente)
                if (corrections.size() > 10) {
                    corrections = new ArrayList<>(corrections.subList(0, 10)); // Mantém as 10 mais recentes
                }
            }
        }

        LearnedProfile updatedProfile = new LearnedProfile(
                affinities,
                portions,
                corrections,
                current.totalInteractions() + 1,
                LocalDateTime.now()
        );

        try {
            entity.setHabitProfile(objectMapper.writeValueAsString(updatedProfile));
            entity.setVersion(entity.getVersion() + 1);
            entity.setUpdatedAt(LocalDateTime.now());
            habitRepository.save(entity);
            log.info("Perfil de hábitos e correções do usuário {} atualizado para versão {}", userId, entity.getVersion());
        } catch (Exception e) {
            log.error("Erro ao salvar perfil de aprendizado contínuo: {}", e.getMessage());
        }
    }

    public String getFewShotPromptContext(UUID userId) {
        if (userId == null) return "";

        return habitRepository.findById(userId).map(entity -> {
            LearnedProfile profile = parseProfile(entity.getHabitProfile());
            StringBuilder sb = new StringBuilder("\n[PREFERÊNCIAS APRENDIDAS DO USUÁRIO - MEMÓRIA VIVA (FEEDBACK LOOP)]:\n");

            if (profile.foodAffinity() != null && !profile.foodAffinity().isEmpty()) {
                List<String> preferred = new ArrayList<>();
                List<String> disliked = new ArrayList<>();

                profile.foodAffinity().forEach((food, score) -> {
                    if (score >= 0.25) preferred.add(food);
                    else if (score <= -0.25) disliked.add(food);
                });

                if (!preferred.isEmpty()) {
                    sb.append("- Alimentos de alta aceitação: ").append(String.join(", ", preferred)).append(".\n");
                }
                if (!disliked.isEmpty()) {
                    sb.append("- Alimentos com rejeição/evitar: ").append(String.join(", ", disliked)).append(".\n");
                }
            }

            // Injeta o histórico de correções e motivos de feedback negativo para guiar o aprendizado
            if (profile.recentCorrections() != null && !profile.recentCorrections().isEmpty()) {
                sb.append("- MOTIVOS DE REJEIÇÃO E FEEDBACKS NEGATIVOS RECENTES (NÃO REPITA ESTES ERROS):\n");
                for (String note : profile.recentCorrections()) {
                    sb.append("  * \"").append(note).append("\"\n");
                }
            }

            sb.append("- Considere rigorosamente essas preferências e correções anteriores para refinar a resposta.\n");
            return sb.toString();
        }).orElse("");
    }

    private LearnedProfile parseProfile(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return new LearnedProfile(new HashMap<>(), new HashMap<>(), new ArrayList<>(), 0, LocalDateTime.now());
        }
        try {
            return objectMapper.readValue(json, LearnedProfile.class);
        } catch (Exception e) {
            log.warn("Erro ao fazer parse do habit_profile JSON: {}", e.getMessage());
            return new LearnedProfile(new HashMap<>(), new HashMap<>(), new ArrayList<>(), 0, LocalDateTime.now());
        }
    }

    private String sanitizeFoodKey(String str) {
        return str.replaceAll("(?i)\\b(\\d+|g|gr|ml|colheres|concha|fatia|de|sopa)\\b", "")
                .replaceAll("[^a-zA-ZÀ-ÿ ]", "")
                .trim()
                .toLowerCase();
    }
}
