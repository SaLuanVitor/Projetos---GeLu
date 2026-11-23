"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFamilyContext } from "@/contexts/FamilyContext";

export function FamilyContextSwitcher() {
  const { families, switchContext, isPersonal, activeFamily } = useFamilyContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border-2 border-tertiary/40 bg-[#fffdfa] dark:bg-[#25201c] px-3.5 py-2 text-xs font-extrabold text-stone-900 dark:text-stone-100 shadow-2xs transition-all hover:border-primary hover:scale-[1.02] active:scale-95 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="text-sm">{isPersonal ? "👤" : "🏠"}</span>
        <span className="max-w-[130px] truncate sm:max-w-[180px] font-bold">
          {isPersonal ? "Meu Espaço Pessoal" : activeFamily?.name ?? "Família"}
        </span>
        <span className="text-[10px] text-stone-500 dark:text-stone-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 origin-top-left rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-[#fffdfa] dark:bg-[#201b17] p-2.5 shadow-2xl ring-1 ring-black/10 z-[150] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-3 py-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Alternar Contexto
            </span>
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
              {isPersonal ? "Modo Individual" : "Modo Família"}
            </span>
          </div>

          <div className="space-y-1.5">
            {families.map((fam) => {
              const isActive = !isPersonal && activeFamily?.id === fam.id;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => {
                    switchContext({ type: "FAMILY", family: fam });
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-label border-2 border-tertiary"
                      : "text-stone-800 dark:text-stone-200 border-2 border-transparent hover:border-amber-900/20 hover:bg-amber-50/80 dark:hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-base shrink-0">🏠</span>
                    <div className="min-w-0">
                      <p className="truncate font-black">{fam.name}</p>
                      <p className={`text-[10px] ${isActive ? "text-amber-100" : "text-stone-500 dark:text-stone-400"}`}>
                        {fam.members.length} {fam.members.length === 1 ? "membro" : "membros"}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white shrink-0">
                      Ativo ✓
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                switchContext({ type: "PERSONAL" });
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                isPersonal
                  ? "bg-primary text-white shadow-label border-2 border-tertiary"
                  : "text-stone-800 dark:text-stone-200 border-2 border-transparent hover:border-amber-900/20 hover:bg-amber-50/80 dark:hover:bg-stone-800"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="text-base shrink-0">👤</span>
                <div className="min-w-0">
                  <p className="truncate font-black">Meu Espaço Pessoal</p>
                  <p className={`text-[10px] ${isPersonal ? "text-amber-100" : "text-stone-500 dark:text-stone-400"}`}>
                    Apenas meus dados e metas
                  </p>
                </div>
              </div>
              {isPersonal && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white shrink-0">
                  Ativo ✓
                </span>
              )}
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
            <Link
              href="/familia"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <span>⚙️</span>
              <span>Gerenciar Famílias & Convites</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
