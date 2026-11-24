package br.com.gelu.menu.ai.idempotency;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IdempotencyServiceTest {

    private IdempotencyService idempotencyService;

    @BeforeEach
    void setUp() {
        idempotencyService = new IdempotencyService();
    }

    @Test
    @DisplayName("Deve salvar e recuperar resposta usando a chave de idempotência")
    void testSaveAndRetrieve() {
        String key = "req-12345";
        idempotencyService.saveResponse(key, "payload_cache");

        assertThat(idempotencyService.hasResponse(key)).isTrue();
        assertThat(idempotencyService.getResponse(key, String.class)).isEqualTo("payload_cache");
    }

    @Test
    @DisplayName("Deve retornar false se a chave não existir")
    void testNonExistingKey() {
        assertThat(idempotencyService.hasResponse("chave-inexistente")).isFalse();
        assertThat(idempotencyService.getResponse("chave-inexistente", String.class)).isNull();
    }
}
