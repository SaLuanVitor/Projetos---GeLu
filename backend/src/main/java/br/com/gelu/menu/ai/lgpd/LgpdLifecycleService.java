package br.com.gelu.menu.ai.lgpd;

import br.com.gelu.menu.admin.AiUsageLog;
import br.com.gelu.menu.admin.AiUsageLogRepository;
import br.com.gelu.menu.ai.learning.UserDietaryHabit;
import br.com.gelu.menu.ai.learning.UserDietaryHabitRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Governança e Ciclo de Vida do Dado Pessoal (LGPD):
 * - Art. 18: Direito à portabilidade e exportação integral de dados do titular.
 * - Art. 16: Direito à eliminação total e anonimização de dados sensíveis e rastros de IA.
 */
@Service
public class LgpdLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(LgpdLifecycleService.class);

    private final UserRepository userRepository;
    private final UserDietaryHabitRepository habitRepository;
    private final AiUsageLogRepository aiUsageLogRepository;

    public LgpdLifecycleService(
            UserRepository userRepository,
            UserDietaryHabitRepository habitRepository,
            AiUsageLogRepository aiUsageLogRepository) {
        this.userRepository = userRepository;
        this.habitRepository = habitRepository;
        this.aiUsageLogRepository = aiUsageLogRepository;
    }

    public record LgpdExportReport(
            UUID userId,
            String userName,
            String userEmail,
            String learnedHabitsJson,
            List<AiUsageLog> aiUsageHistory,
            LocalDateTime exportedAt,
            String legalBasis
    ) {}

    public record LgpdPurgeResult(
            UUID userId,
            boolean habitsPurged,
            boolean logsAnonymized,
            LocalDateTime purgedAt,
            String confirmationMessage
    ) {}

    @Transactional(readOnly = true)
    public LgpdExportReport exportUserData(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        String name = user != null ? user.getName() : "Desconhecido";
        String email = user != null ? user.getEmail() : "Desconhecido";

        String habits = habitRepository.findById(userId)
                .map(UserDietaryHabit::getHabitProfile)
                .orElse("{}");

        List<AiUsageLog> logs = aiUsageLogRepository.findAllByUserId(userId);

        return new LgpdExportReport(
                userId,
                name,
                email,
                habits,
                logs,
                LocalDateTime.now(),
                "LGPD Artigo 18, Inciso V (Portabilidade e Acesso aos Dados)"
        );
    }

    @Transactional
    public LgpdPurgeResult purgeUserData(UUID userId) {
        boolean habitsPurged = false;
        if (habitRepository.existsById(userId)) {
            habitRepository.deleteById(userId);
            habitsPurged = true;
        }

        aiUsageLogRepository.anonymizeByUserId(userId);
        log.info("LGPD Art. 16 executado com sucesso: dados de IA e hábitos do usuário {} foram eliminados/anonimizados.", userId);

        return new LgpdPurgeResult(
                userId,
                habitsPurged,
                true,
                LocalDateTime.now(),
                "Todos os dados sensíveis de nutrição, hábitos alimentares e rastros de IA foram eliminados e anonimizados permanentemente (LGPD Art. 16)."
        );
    }
}
