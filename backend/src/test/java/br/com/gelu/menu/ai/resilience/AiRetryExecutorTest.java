package br.com.gelu.menu.ai.resilience;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class AiRetryExecutorTest {

    private AiRetryExecutor retryExecutor;

    @BeforeEach
    void setUp() {
        retryExecutor = new AiRetryExecutor();
    }

    @Test
    @DisplayName("Deve retornar resultado na primeira tentativa com sucesso")
    void testSuccessOnFirstAttempt() {
        String result = retryExecutor.executeWithRetry("testOp", () -> "sucesso", () -> "fallback");
        assertThat(result).isEqualTo("sucesso");
        assertThat(retryExecutor.isCircuitOpen()).isFalse();
    }

    @Test
    @DisplayName("Deve tentar novamente e retornar sucesso na segunda tentativa")
    void testSuccessOnSecondAttempt() {
        AtomicInteger counter = new AtomicInteger(0);
        String result = retryExecutor.executeWithRetry("testOp", () -> {
            if (counter.incrementAndGet() == 1) {
                throw new RuntimeException("Falha transitória");
            }
            return "recuperado";
        }, () -> "fallback");

        assertThat(result).isEqualTo("recuperado");
        assertThat(counter.get()).isEqualTo(2);
        assertThat(retryExecutor.isCircuitOpen()).isFalse();
    }

    @Test
    @DisplayName("Deve degradar para fallback após esgotar tentativas de retry")
    void testDegradeToFallbackAfterRetries() {
        AtomicInteger counter = new AtomicInteger(0);
        String result = retryExecutor.executeWithRetry("testOp", () -> {
            counter.incrementAndGet();
            throw new RuntimeException("Erro persistente");
        }, () -> "resultado_fallback");

        assertThat(result).isEqualTo("resultado_fallback");
        assertThat(counter.get()).isEqualTo(3);
    }
}
