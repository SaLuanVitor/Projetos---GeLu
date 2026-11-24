package br.com.gelu.menu.ai.resilience;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Callable;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Executor de Resiliência: Circuit Breaker leve + Retry com Backoff Exponencial e Jitter.
 * Garante que falhas externas (timeout > 1.5s, rate limit 429, 503) sejam tratadas
 * com degradação graciosa para fallback determinístico local.
 */
@Component
public class AiRetryExecutor {

    private static final Logger log = LoggerFactory.getLogger(AiRetryExecutor.class);

    private static final int MAX_ATTEMPTS = 3;
    private static final long BASE_BACKOFF_MS = 150L;
    private static final long MAX_JITTER_MS = 50L;
    private static final int FAILURE_THRESHOLD = 3;
    private static final Duration CIRCUIT_RESET_TIMEOUT = Duration.ofSeconds(30);

    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicBoolean circuitOpen = new AtomicBoolean(false);
    private volatile Instant circuitOpenedAt = Instant.EPOCH;

    public boolean isCircuitOpen() {
        if (circuitOpen.get()) {
            if (Duration.between(circuitOpenedAt, Instant.now()).compareTo(CIRCUIT_RESET_TIMEOUT) > 0) {
                log.info("Circuit breaker em Half-Open: testando recuperação do provedor de IA.");
                circuitOpen.set(false);
                return false;
            }
            return true;
        }
        return false;
    }

    public void recordSuccess() {
        consecutiveFailures.set(0);
        circuitOpen.set(false);
    }

    public void recordFailure(Throwable t) {
        int failures = consecutiveFailures.incrementAndGet();
        log.warn("Falha registrada no provedor de IA (#{}): {}", failures, t.getMessage());
        if (failures >= FAILURE_THRESHOLD) {
            circuitOpen.set(true);
            circuitOpenedAt = Instant.now();
            log.error("Circuit Breaker ABERTO! Provedor primário suspenso por {}s. Roteando diretamente para Fallback Local.",
                    CIRCUIT_RESET_TIMEOUT.toSeconds());
        }
    }

    public <T> T executeWithRetry(String operationName, Callable<T> primaryCall, Callable<T> fallbackCall) {
        if (isCircuitOpen()) {
            log.info("[CircuitBreaker] Circuito aberto. Acionando fallback local imediato para: {}", operationName);
            try {
                return fallbackCall.call();
            } catch (Exception e) {
                throw new RuntimeException("Erro ao executar fallback local: " + e.getMessage(), e);
            }
        }

        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                T result = primaryCall.call();
                recordSuccess();
                return result;
            } catch (Exception e) {
                lastException = e;
                log.warn("[RetryEngine] Falha na tentativa {}/{} para {}: {}", attempt, MAX_ATTEMPTS, operationName, e.getMessage());

                if (attempt < MAX_ATTEMPTS) {
                    long backoff = (long) (BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
                    long jitter = ThreadLocalRandom.current().nextLong(MAX_JITTER_MS);
                    try {
                        Thread.sleep(backoff + jitter);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        recordFailure(lastException);
        log.info("[Fallback] Esgotadas as tentativas para {}. Invocando motor heurístico local.", operationName);
        try {
            return fallbackCall.call();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao executar fallback após retries: " + e.getMessage(), e);
        }
    }
}
