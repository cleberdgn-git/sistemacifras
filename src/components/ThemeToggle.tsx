"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useMusic();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
        theme === "dark"
          ? "bg-neutral-800 text-amber-400 hover:bg-neutral-700 border border-neutral-700"
          : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200"
      } ${className}`}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro (palco)"}
      aria-label="Alternar tema"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        </span>
      )}
    </button>
  );
}

