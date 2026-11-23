"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

export function ThemeHeaderButton() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("gelu-theme");
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    apply(initial);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("gelu-theme", next);
    apply(next);
  };

  const apply = (mode: "light" | "dark") => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  };

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full border-2 border-transparent" />;
  }

  const tooltipLabel = theme === "light" ? "Alternar para Modo Escuro" : "Alternar para Modo Claro";

  return (
    <Tooltip text={tooltipLabel} position="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={tooltipLabel}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-surface dark:bg-stone-800 text-base font-extrabold text-primary transition-transform hover:rotate-12 cursor-pointer shadow-xs"
      >
        <span>{theme === "light" ? "🌙" : "☀️"}</span>
      </button>
    </Tooltip>
  );
}
