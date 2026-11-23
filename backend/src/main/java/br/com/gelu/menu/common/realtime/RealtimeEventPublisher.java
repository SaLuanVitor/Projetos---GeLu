package br.com.gelu.menu.common.realtime;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimeEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RealtimeEventPublisher.class);
  private final SimpMessagingTemplate messagingTemplate;

  public RealtimeEventPublisher(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void publishFamilyEvent(UUID familyId, String eventType, Object payload) {
    if (familyId == null) {
      return;
    }
    String destination = "/topic/family/" + familyId;
    RealtimeEvent event =
        new RealtimeEvent(eventType, familyId, payload, System.currentTimeMillis());
    try {
      messagingTemplate.convertAndSend(destination, event);
      log.debug("Evento de tempo real transmitido para {}: {}", destination, eventType);
    } catch (Exception e) {
      log.error("Erro ao transmitir evento de tempo real para {}: {}", destination, e.getMessage());
    }
  }

  public record RealtimeEvent(String type, UUID familyId, Object data, long timestamp) {}
}
