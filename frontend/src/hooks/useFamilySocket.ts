"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useToast } from "@/components/ui/Toast";

export type FamilyRealtimeEvent = {
  type: string;
  familyId: string;
  data: unknown;
  timestamp: number;
};

type EventHandler = (event: FamilyRealtimeEvent) => void;

const eventListeners = new Set<EventHandler>();

export function subscribeToFamilyEvents(handler: EventHandler) {
  eventListeners.add(handler);
  return () => {
    eventListeners.delete(handler);
  };
}

export function useFamilySocket(familyId: string | null | undefined) {
  const { showToast } = useToast();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const getWsUrl = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
    // Transforma http://localhost:8080/api/v1 em ws://localhost:8080/ws-raw
    return apiUrl.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "/ws-raw");
  }, []);

  useEffect(() => {
    if (!familyId) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const wsUrl = getWsUrl();
    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {
        // silêncio em prod
      },
      onConnect: () => {
        setConnected(true);
        // Inscreve no tópico da família
        client.subscribe(`/topic/family/${familyId}`, (message) => {
          try {
            const event = JSON.parse(message.body) as FamilyRealtimeEvent;

            // Dispara para listeners registrados nas páginas
            eventListeners.forEach((fn) => {
              try {
                fn(event);
              } catch (err) {
                console.error("Erro no listener de WebSocket:", err);
              }
            });

            // Feedback visual suave de sincronização
            switch (event.type) {
              case "COUPLE_NOTE_CREATED":
                showToast("💌 Novo bilhete adicionado no mural!", "info");
                break;
              case "COUPLE_NOTE_ACKNOWLEDGED":
                showToast("❤️ Um bilhete foi marcado como lido!", "success");
                break;
              case "SCHEDULE_TASK_TOGGLED":
                showToast("✅ Uma tarefa foi atualizada na agenda!", "info");
                break;
              case "DIET_MEAL_CREATED":
              case "DIET_MEAL_UPDATED":
                showToast("🍽️ O cardápio familiar foi atualizado!", "info");
                break;
              case "FAMILY_SPACE_ITEM_CREATED":
                showToast("🏡 Novo item registrado em Nosso Espaço!", "info");
                break;
              default:
                break;
            }
          } catch (err) {
            console.error("Erro ao processar mensagem do WebSocket:", err);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.warn("Erro no STOMP:", frame.headers["message"]);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [familyId, getWsUrl, showToast]);

  return { connected };
}
