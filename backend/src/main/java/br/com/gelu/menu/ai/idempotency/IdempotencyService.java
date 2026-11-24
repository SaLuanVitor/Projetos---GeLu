package br.com.gelu.menu.ai.idempotency;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de Idempotência para Requisições de IA e Persistência de Refeições.
 * Evita execuções duplicadas, re-cobrança de tokens Gemini e duplicação no banco
 * em caso de retries de rede ou duplo clique do usuário.
 */
@Service
public class IdempotencyService {

    private static final Duration TTL = Duration.ofMinutes(15);
    private final Map<String, CachedResponse> responseCache = new ConcurrentHashMap<>();

    private record CachedResponse(Object response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public boolean hasResponse(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) return false;
        CachedResponse cached = responseCache.get(idempotencyKey);
        if (cached != null) {
            if (cached.isExpired()) {
                responseCache.remove(idempotencyKey);
                return false;
            }
            return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    public <T> T getResponse(String idempotencyKey, Class<T> responseType) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) return null;
        CachedResponse cached = responseCache.get(idempotencyKey);
        if (cached != null && !cached.isExpired()) {
            return (T) cached.response();
        }
        return null;
    }

    public void saveResponse(String idempotencyKey, Object response) {
        if (idempotencyKey != null && !idempotencyKey.isBlank() && response != null) {
            responseCache.put(idempotencyKey, new CachedResponse(response, Instant.now().plus(TTL)));
        }
    }
}
