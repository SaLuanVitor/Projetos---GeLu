"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "gelu-theme";

export function ThemeToggle({
  className = "",
  showLabels = false,
}: {
  className?: string;
  showLabels?: boolean;
}) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || "light";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const changeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (mode: ThemeMode) => {
    const isDark =
      mode === "dark" ||
      (mode === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  };

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-full border border-stone-200 bg-white/80 ${className}`} />
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-stone-300 dark:border-stone-700 bg-white/90 dark:bg-stone-900/90 p-1 shadow-sm backdrop-blur-sm transition-all ${className}`}>
      <button
        type="button"
        onClick={() => changeTheme("light")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
          theme === "light"
            ? "bg-amber-100 text-amber-950 shadow-xs dark:bg-amber-500/20 dark:text-amber-300"
            : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
        }`}
        title="Modo Claro"
      >
        <span>☀️</span>
        {showLabels && <span>Claro</span>}
      </button>

      <button
        type="button"
        onClick={() => changeTheme("dark")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-indigo-600 text-white shadow-xs"
            : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
        }`}
        title="Modo Escuro"
      >
        <span>🌙</span>
        {showLabels && <span>Escuro</span>}
      </button>

      <button
        type="button"
        onClick={() => changeTheme("system")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
          theme === "system"
            ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
            : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
        }`}
        title="Automático (Sistema)"
      >
        <span>💻</span>
        {showLabels && <span>Auto</span>}
      </button>
    </div>
  );
}
