"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FamilyResponse } from "@/types/api";
import { listFamilies } from "@/services/families";
import { getValidSession } from "@/services/auth";

export type ContextType = "FAMILY" | "PERSONAL";

export type ActiveContext =
  | {
      type: "FAMILY";
      family: FamilyResponse;
    }
  | {
      type: "PERSONAL";
    };

interface FamilyContextType {
  activeContext: ActiveContext;
  families: FamilyResponse[];
  loadingFamilies: boolean;
  switchContext: (context: ActiveContext) => void;
  refreshFamilies: () => Promise<void>;
  isPersonal: boolean;
  activeFamily: FamilyResponse | null;
}

const STORAGE_KEY = "gelu_active_context";

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [activeContext, setActiveContext] = useState<ActiveContext>({
    type: "PERSONAL",
  });

  const refreshFamilies = useCallback(async () => {
    try {
      const session = await getValidSession();
      if (!session) {
        setLoadingFamilies(false);
        return;
      }

      const famList = await listFamilies(session.accessToken);
      setFamilies(famList);

      // Tenta recuperar do storage
      const savedRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (parsed.type === "PERSONAL") {
            setActiveContext({ type: "PERSONAL" });
            setLoadingFamilies(false);
            return;
          }
          if (parsed.type === "FAMILY" && parsed.familyId) {
            const found = famList.find((f) => f.id === parsed.familyId);
            if (found) {
              setActiveContext({ type: "FAMILY", family: found });
              setLoadingFamilies(false);
              return;
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      // Default: primeira família ou pessoal se não tiver nenhuma
      if (famList.length > 0) {
        setActiveContext({ type: "FAMILY", family: famList[0] });
      } else {
        setActiveContext({ type: "PERSONAL" });
      }
    } catch (err) {
      console.error("Erro ao carregar famílias no contexto:", err);
      setActiveContext({ type: "PERSONAL" });
    } finally {
      setLoadingFamilies(false);
    }
  }, []);

  useEffect(() => {
    refreshFamilies();
  }, [refreshFamilies]);

  const switchContext = (ctx: ActiveContext) => {
    setActiveContext(ctx);
    if (typeof window !== "undefined") {
      if (ctx.type === "PERSONAL") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "PERSONAL" }));
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ type: "FAMILY", familyId: ctx.family.id })
        );
      }
    }
  };

  const isPersonal = activeContext.type === "PERSONAL";
  const activeFamily = activeContext.type === "FAMILY" ? activeContext.family : null;

  return (
    <FamilyContext.Provider
      value={{
        activeContext,
        families,
        loadingFamilies,
        switchContext,
        refreshFamilies,
        isPersonal,
        activeFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyContext() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamilyContext deve ser usado dentro de um FamilyProvider");
  }
  return context;
}
