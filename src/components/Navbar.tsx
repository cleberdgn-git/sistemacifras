"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useMusic } from "@/context/MusicContext";
import { Cloud, RefreshCw } from "lucide-react";

export function Navbar() {
  const { isCloudConnected, isSyncing, refreshFromSupabase } = useMusic();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-blue-500/40 shadow-md shadow-blue-500/20 bg-neutral-950 shrink-0 ring-1 ring-blue-500/20">
            <img
              src="/app-icon.jpg?v=3"
              alt="Louvor Cifras"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
              Louvor Cifras
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-none">
              Gestor & Visualizador de Palco
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCloudConnected && (
            <button
              type="button"
              onClick={refreshFromSupabase}
              disabled={isSyncing}
              title="Supabase Conectado - Clique para sincronizar agora"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="hidden sm:inline">
                {isSyncing ? "Sincronizando..." : "Nuvem OK"}
              </span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
