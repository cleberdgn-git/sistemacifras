"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  List,
  Music4,
  Clock,
  Timer,
  ScrollText,
  Focus,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { ThemeToggle } from "./ThemeToggle";
import {
  isChordLine,
  transposeChordsText,
  getLineAnnotationType,
  parseInlineAnnotations,
  ANNOTATION_STYLES,
  parseChordSections,
  ChordSection,
} from "@/utils/chordUtils";

export function SetlistViewer() {
  const {
    selectedSongsList,
    currentSongIndex,
    currentSong,
    nextSong,
    prevSong,
    goToSong,
    moveSongUp,
    moveSongDown,
    exitViewer,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    isFullscreen,
    toggleFullscreen,
    theme,
  } = useMusic();

  const [semitoneOffset, setSemitoneOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCountdown, setIsCountdown] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(2);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [sectionElapsedMs, setSectionElapsedMs] = useState<number>(0);
  const [showSongDrawer, setShowSongDrawer] = useState<boolean>(false);
  const [showToolsWhilePlaying, setShowToolsWhilePlaying] = useState<boolean>(false);

  // Novo: Alternador de Modo de Leitura ('scroll' = Modo Rolagem, 'focus' = Modo Foco)
  const [viewMode, setViewMode] = useState<"scroll" | "focus">("scroll");

  // Estado para transição suave de slide no Modo Foco (Saída subindo + Entrada subindo)
  const [exitingSection, setExitingSection] = useState<{
    section: ChordSection;
    direction: "up" | "down";
  } | null>(null);
  const prevSectionIndexRef = useRef<number>(currentSectionIndex);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [activeCardHeight, setActiveCardHeight] = useState<number>(200);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Refs de controle para o requestAnimationFrame (mantém valores síncronos no frame)
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const currentSectionIndexRef = useRef<number>(0);
  const elapsedMsRef = useRef<number>(0);
  const sectionStartScrollTopRef = useRef<number>(0);
  const sectionScrollDistanceRef = useRef<number>(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewModeRef = useRef<"scroll" | "focus">("scroll");

  // Sincroniza refs com state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentSectionIndexRef.current = currentSectionIndex;
  }, [currentSectionIndex]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // Cifra com transposição aplicada
  const transposedChords = useMemo(() => {
    if (!currentSong) return "";
    return transposeChordsText(currentSong.chords, semitoneOffset);
  }, [currentSong, semitoneOffset]);

  // Divisão da cifra em blocos de seções estruturais com tempos
  const sections = useMemo(() => {
    return parseChordSections(transposedChords);
  }, [transposedChords]);

  // Manter tamanho do array de refs correspondente ao número de seções
  useEffect(() => {
    sectionRefs.current = sectionRefs.current.slice(0, sections.length);
  }, [sections.length]);

  // Gerencia a transição suave de slide no Modo Foco
  useEffect(() => {
    if (prevSectionIndexRef.current !== currentSectionIndex) {
      const prevIdx = prevSectionIndexRef.current;
      const direction: "up" | "down" = currentSectionIndex > prevIdx ? "up" : "down";
      const oldSection = sections[prevIdx];

      if (oldSection && viewMode === "focus") {
        setExitingSection({ section: oldSection, direction });
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = setTimeout(() => {
          setExitingSection(null);
        }, 650);
      }

      prevSectionIndexRef.current = currentSectionIndex;
    }
  }, [currentSectionIndex, sections, viewMode]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  // Monitora a altura do container e do card ativo para calcular quantas seções futuras cabem na tela
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    const measureSizes = () => {
      if (viewerContainerRef.current) {
        setContainerHeight(viewerContainerRef.current.clientHeight);
      }
      if (activeCardRef.current) {
        setActiveCardHeight(activeCardRef.current.offsetHeight);
      }
    };

    measureSizes();

    const ro = new ResizeObserver(() => {
      measureSizes();
    });
    ro.observe(container);

    window.addEventListener("resize", measureSizes);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureSizes);
    };
  }, []);

  useEffect(() => {
    if (activeCardRef.current) {
      setActiveCardHeight(activeCardRef.current.offsetHeight);
    }
  }, [currentSectionIndex, sections, fontSize, viewMode]);

  // Limpa timer de countdown
  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCountdown(false);
  }, []);

  // Parar reprodução e limpar frame
  const stopPlayback = useCallback(() => {
    clearCountdown();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimestampRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setShowToolsWhilePlaying(false);
  }, [clearCountdown]);

  // Reiniciar a música do início
  const restartPlayback = useCallback(() => {
    stopPlayback();
    setCurrentSectionIndex(0);
    currentSectionIndexRef.current = 0;
    setSectionElapsedMs(0);
    elapsedMsRef.current = 0;
    window.scrollTo(0, 0);
    if (viewerContainerRef.current) {
      viewerContainerRef.current.scrollTop = 0;
    }
  }, [stopPlayback]);

  // Resetar ao trocar de música
  useEffect(() => {
    setSemitoneOffset(0);
    stopPlayback();
    setCurrentSectionIndex(0);
    currentSectionIndexRef.current = 0;
    setSectionElapsedMs(0);
    elapsedMsRef.current = 0;
    window.scrollTo(0, 0);
    if (viewerContainerRef.current) {
      viewerContainerRef.current.scrollTop = 0;
    }
  }, [currentSongIndex, stopPlayback]);

  // Alternar entre Modo Rolagem e Modo Foco
  const handleToggleViewMode = useCallback(
    (newMode: "scroll" | "focus") => {
      setViewMode(newMode);
      viewModeRef.current = newMode;
      if (newMode === "focus") {
        if (viewerContainerRef.current) {
          viewerContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        // Modo rolagem: reposiciona suavemente no terço superior da seção ativa
        const container = viewerContainerRef.current;
        const currentEl = sectionRefs.current[currentSectionIndexRef.current];
        if (container && currentEl) {
          const readingZoneOffset = Math.max(20, Math.floor(container.clientHeight * 0.18));
          const targetTop = Math.max(0, currentEl.offsetTop - readingZoneOffset);
          container.scrollTo({ top: targetTop, behavior: "smooth" });
        }
      }
    },
    []
  );

  /**
   * REGRA 2: Cálculo de Trajeto (Modo Rolagem)
   * O espaço que a página deve rolar durante o tempo de uma seção é a distância exata
   * entre o topo da seção atual e o topo da seção seguinte.
   */
  const calculateSectionDistance = useCallback((index: number): number => {
    const currentEl = sectionRefs.current[index];
    const nextEl = sectionRefs.current[index + 1];

    if (!currentEl) return 100;

    if (nextEl) {
      return Math.max(10, nextEl.offsetTop - currentEl.offsetTop);
    }

    return Math.max(50, currentEl.offsetHeight);
  }, []);

  /**
   * Inicia o loop requestAnimationFrame para ambos os modos:
   * - Modo Rolagem: calcula o scroll suave com respeito à zona de leitura
   * - Modo Foco: não rola a página; troca a seção ativa instantaneamente como slide ao final dos segundos
   */
  const startRafLoop = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTimestampRef.current = null;

    const currentIdx = currentSectionIndexRef.current;
    const container = viewerContainerRef.current;
    if (container && viewModeRef.current === "scroll") {
      sectionStartScrollTopRef.current = container.scrollTop;
      sectionScrollDistanceRef.current = calculateSectionDistance(currentIdx);
    }

    const frameStep = (now: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = now;
      }

      const deltaMs = now - lastTimestampRef.current;
      lastTimestampRef.current = now;

      const activeIdx = currentSectionIndexRef.current;
      const activeSection = sections[activeIdx];

      if (!activeSection) {
        stopPlayback();
        return;
      }

      const durationMs = activeSection.durationSeconds * 1000;
      elapsedMsRef.current += deltaMs;
      const progress = Math.min(1, elapsedMsRef.current / durationMs);

      // No Modo Rolagem: executa o scroll contínuo e suave
      if (viewModeRef.current === "scroll") {
        const containerEl = viewerContainerRef.current;
        const currentEl = sectionRefs.current[activeIdx];

        if (containerEl && currentEl) {
          const startTop = sectionStartScrollTopRef.current;
          const totalDistance = sectionScrollDistanceRef.current;
          const computedScroll = startTop + totalDistance * progress;

          const isShortSection = currentEl.offsetHeight < containerEl.clientHeight * 0.65;
          let finalScroll = computedScroll;

          if (isShortSection) {
            const readingZoneOffset = Math.max(20, Math.floor(containerEl.clientHeight * 0.18));
            const maxAllowedScroll = Math.max(0, currentEl.offsetTop - readingZoneOffset);
            finalScroll = Math.min(computedScroll, maxAllowedScroll);
          } else {
            const maxAllowedScroll = Math.max(
              0,
              currentEl.offsetTop + currentEl.offsetHeight - containerEl.clientHeight + 60
            );
            finalScroll = Math.min(computedScroll, maxAllowedScroll);
          }

          containerEl.scrollTop = finalScroll;
        }
      }
      // No Modo Foco: A página NÃO rola! Permanece fixa enquanto o slide exibe a seção ativa

      setSectionElapsedMs(elapsedMsRef.current);

      if (progress >= 1) {
        // Seção finalizada! Troca a seção ativa instantaneamente como slide
        if (activeIdx + 1 < sections.length) {
          const nextIdx = activeIdx + 1;
          currentSectionIndexRef.current = nextIdx;
          setCurrentSectionIndex(nextIdx);
          elapsedMsRef.current = 0;
          setSectionElapsedMs(0);

          if (viewModeRef.current === "scroll") {
            const containerEl = viewerContainerRef.current;
            if (containerEl) {
              sectionStartScrollTopRef.current = containerEl.scrollTop;
            }
            sectionScrollDistanceRef.current = calculateSectionDistance(nextIdx);
          }

          rafRef.current = requestAnimationFrame(frameStep);
        } else {
          // Fim da música
          stopPlayback();
        }
      } else {
        rafRef.current = requestAnimationFrame(frameStep);
      }
    };

    rafRef.current = requestAnimationFrame(frameStep);
  }, [sections, calculateSectionDistance, stopPlayback]);

  /**
   * Controle de Iniciar / Pausar
   */
  const togglePlayPause = useCallback(() => {
    if (isCountdown) {
      clearCountdown();
      setShowToolsWhilePlaying(false);
      return;
    }

    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    setShowToolsWhilePlaying(false);
    const isAtStart = currentSectionIndexRef.current === 0 && elapsedMsRef.current === 0;

    if (isAtStart) {
      window.scrollTo(0, 0);
      if (viewerContainerRef.current) {
        viewerContainerRef.current.scrollTop = 0;
      }

      setIsCountdown(true);
      setCountdownSeconds(2);

      let remaining = 2;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setIsCountdown(false);
          startRafLoop();
        } else {
          setCountdownSeconds(remaining);
        }
      }, 1000);
    } else {
      startRafLoop();
    }
  }, [isCountdown, clearCountdown, stopPlayback, startRafLoop]);

  // Pular diretamente para uma seção
  const jumpToSection = useCallback(
    (index: number) => {
      clearCountdown();
      const validIndex = Math.max(0, Math.min(index, sections.length - 1));
      currentSectionIndexRef.current = validIndex;
      setCurrentSectionIndex(validIndex);
      elapsedMsRef.current = 0;
      setSectionElapsedMs(0);
      lastTimestampRef.current = null;

      if (viewModeRef.current === "scroll") {
        const container = viewerContainerRef.current;
        const targetEl = sectionRefs.current[validIndex];

        if (container && targetEl) {
          const readingZoneOffset = Math.max(20, Math.floor(container.clientHeight * 0.18));
          const targetTop = Math.max(0, targetEl.offsetTop - readingZoneOffset);

          container.scrollTo({
            top: targetTop,
            behavior: isPlayingRef.current ? "auto" : "smooth",
          });

          sectionStartScrollTopRef.current = targetTop;
          sectionScrollDistanceRef.current = calculateSectionDistance(validIndex);
        }
      } else {
        // No Modo Foco, garante scroll no topo
        if (viewerContainerRef.current) {
          viewerContainerRef.current.scrollTop = 0;
        }
      }
    },
    [sections.length, clearCountdown, calculateSectionDistance]
  );

  // Atalhos de teclado para palco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight") {
        nextSong();
      } else if (e.key === "ArrowLeft") {
        prevSong();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSong, prevSong, isFullscreen, toggleFullscreen, togglePlayPause]);

  if (!currentSong || selectedSongsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Nenhuma música no Setlist</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Volte para a biblioteca e selecione as músicas do culto.
        </p>
        <button
          onClick={exitViewer}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium"
        >
          Voltar para Músicas
        </button>
      </div>
    );
  }

  const activeSection = sections[currentSectionIndex] || sections[0];
  const nextSection = sections[currentSectionIndex + 1] || null;
  const subsequentSection = sections[currentSectionIndex + 2] || null;

  const activeRemainingSeconds = activeSection
    ? Math.max(0, Math.ceil(activeSection.durationSeconds - sectionElapsedMs / 1000))
    : 0;

  // Primeira linha com conteúdo real da próxima seção para exibição no Modo Foco
  const firstMeaningfulLineOfNext = nextSection?.lines?.find((l) => {
    const trimmed = l.trim();
    return trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("DINÂMICA:") && !trimmed.startsWith("ATENÇÃO:");
  }) || nextSection?.lines?.[0] || "";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col select-text transition-colors duration-200 ${
        theme === "dark" ? "bg-[#121212] text-neutral-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* BARRA SUPERIOR DO PALCO (Stage Top Bar) */}
      <header className="shrink-0 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md z-20 shadow-xs">
        {/* Linha 1: Navegação, Identificação da Música e Acesso ao Setlist */}
        <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={exitViewer}
            className="p-2 -ml-1 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shrink-0"
            title="Voltar para a biblioteca"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-semibold">Biblioteca</span>
          </button>

          {/* Centro: Nome da Música, Artista e Tom em Destaque */}
          <div className="flex-1 min-w-0 text-center px-1">
            <h1 className="font-extrabold text-sm sm:text-base truncate text-neutral-900 dark:text-white leading-tight">
              {currentSong.title}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              <span className="truncate">{currentSong.artist}</span>
              {currentSong.key && (
                <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">
                  • Tom: {currentSong.key}{" "}
                  {semitoneOffset !== 0 ? `(${semitoneOffset > 0 ? "+" : ""}${semitoneOffset})` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito: Posição no Culto e Tela Cheia */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSongDrawer(true)}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
              title="Abrir ordem do culto"
            >
              <List className="w-4 h-4" />
              <span>
                {currentSongIndex + 1}/{selectedSongsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Linha 2: Barra de Ferramentas de Palco (Play/Pause, Alternador Modo Rolagem/Foco, Tom, Fonte, Tema) */}
        <div className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-neutral-100/80 dark:bg-neutral-900/80 border-t border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between gap-2 transition-all">
          {/* GRUPO PRINCIPAL: Controle Play/Pause & Seção Atual */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botão Play / Pause */}
            <button
              type="button"
              onClick={togglePlayPause}
              title={
                isCountdown
                  ? "Clique para cancelar o início"
                  : isPlaying
                  ? "Pausar"
                  : "Iniciar"
              }
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-sm active:scale-95 ${
                isCountdown
                  ? "bg-amber-500 text-neutral-950 ring-2 ring-amber-400 animate-pulse font-black"
                  : isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isCountdown ? (
                <>
                  <Timer className="w-3.5 h-3.5 animate-spin" />
                  <span>Em {countdownSeconds}s...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            {/* Reiniciar do topo */}
            <button
              type="button"
              onClick={restartPlayback}
              title="Reiniciar do começo da música"
              className="p-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Navegador de Seções (Anterior / Atual / Próxima) */}
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl px-1 py-0.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
              <button
                type="button"
                onClick={() => jumpToSection(currentSectionIndex - 1)}
                disabled={currentSectionIndex === 0}
                title="Seção anterior"
                className="p-1 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:text-blue-500 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="px-1.5 text-center min-w-[70px] sm:min-w-[90px]">
                <div className="text-[11px] font-extrabold text-blue-600 dark:text-sky-400 truncate max-w-[90px] sm:max-w-[120px]">
                  {activeSection?.name || "Seção"}
                </div>
                <div className="text-[9px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 leading-none">
                  {isCountdown ? "Preparando" : `${activeRemainingSeconds}s`} • {currentSectionIndex + 1}/{sections.length}
                </div>
              </div>

              <button
                type="button"
                onClick={() => jumpToSection(currentSectionIndex + 1)}
                disabled={currentSectionIndex >= sections.length - 1}
                title="Próxima seção"
                className="p-1 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 hover:text-blue-500 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* GRUPO SECUNDÁRIO: Alternador de Modo (Rolagem / Foco), Tom, Fonte & Tema */}
          {/* Recolhe automaticamente ao Iniciar (Play), reaparecendo ao Pausar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {(!isPlaying && !isCountdown || showToolsWhilePlaying) && (
              <div className="flex items-center gap-1.5 sm:gap-2 animate-in fade-in duration-150">
                {/* BOTÃO TOGGLE: Modo Rolagem vs Modo Foco */}
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl p-0.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleToggleViewMode("scroll")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      viewMode === "scroll"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                    title="Modo Rolagem: Rola a página continuamente durante as seções"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rolagem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleViewMode("focus")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      viewMode === "focus"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                    title="Modo Foco: Sem rolagem; exibe seção ativa em destaque estilo slide"
                  >
                    <Focus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Foco</span>
                  </button>
                </div>

                {/* Controle de Tom (-1 / Tom / +1) */}
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl p-0.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSemitoneOffset((prev) => prev - 1)}
                    title="Descer 1 semitom"
                    className="px-2 py-1 text-xs font-extrabold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 active:scale-90 transition-all"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemitoneOffset(0)}
                    title={semitoneOffset !== 0 ? "Clique para voltar ao tom original" : "Tom original"}
                    className={`text-[10px] font-bold px-1 min-w-[32px] text-center select-none transition-colors ${
                      semitoneOffset !== 0
                        ? "text-blue-600 dark:text-blue-400 font-extrabold underline"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  >
                    {semitoneOffset === 0 ? "Tom" : `${semitoneOffset > 0 ? "+" : ""}${semitoneOffset}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemitoneOffset((prev) => prev + 1)}
                    title="Subir 1 semitom"
                    className="px-2 py-1 text-xs font-extrabold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 active:scale-90 transition-all"
                  >
                    +1
                  </button>
                </div>

                {/* Controle de Fonte (A- / A+) */}
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl p-0.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    title="Diminuir fonte"
                    className="px-2 py-1 text-xs font-extrabold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 active:scale-90 transition-all"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={resetFontSize}
                    title="Tamanho da fonte"
                    className="text-[10px] font-mono px-1 min-w-[28px] text-center text-neutral-500 dark:text-neutral-400 font-semibold select-none"
                  >
                    {fontSize}
                  </button>
                  <button
                    type="button"
                    onClick={increaseFontSize}
                    title="Aumentar fonte"
                    className="px-2 py-1 text-xs font-extrabold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 active:scale-90 transition-all"
                  >
                    A+
                  </button>
                </div>

                {/* Alternador de Tema */}
                <div className="shrink-0">
                  <ThemeToggle />
                </div>
              </div>
            )}

            {/* Botão de Ajustes sob demanda quando tocando/countdown */}
            {(isPlaying || isCountdown) && (
              <button
                type="button"
                onClick={() => setShowToolsWhilePlaying((prev) => !prev)}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showToolsWhilePlaying
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-200/50 dark:bg-neutral-800/60"
                }`}
                title={showToolsWhilePlaying ? "Recolher ferramentas" : "Ajustes de tom, fonte e modo"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {showToolsWhilePlaying ? "Recolher" : "Ajustes"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* AVISO VISUAL DE ATRASO INICIAL (2 SEGUNDOS) */}
      {isCountdown && (
        <div className="bg-amber-500 text-neutral-950 font-bold px-4 py-1.5 text-xs flex items-center justify-center gap-2 shadow-sm animate-pulse z-20">
          <Timer className="w-4 h-4 animate-spin" />
          <span>Posicione as mãos no instrumento... Iniciando em {countdownSeconds} segundo(s)</span>
        </div>
      )}

      {/* ÁREA PRINCIPAL */}
      {viewMode === "scroll" ? (
        /* ========================================================
           1. MODO ROLAGEM: ROLAGEM CONTÍNUA COM PADDING DE 70VH
           ======================================================== */
        <main
          ref={viewerContainerRef}
          style={{ paddingBottom: "70vh" }}
          className="flex-1 overflow-y-auto overflow-x-auto px-3 sm:px-6 py-6"
        >
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Cabeçalho da Música no Palco */}
            <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                  {currentSong.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400 font-semibold">
                    {currentSong.artist}
                  </span>
                  {currentSong.key && (
                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      Tom: {currentSong.key}
                      {semitoneOffset !== 0 && (
                        <span className="ml-1 text-blue-500 font-extrabold">
                          ({semitoneOffset > 0 ? `+${semitoneOffset}` : semitoneOffset})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-semibold">
                  Modo Rolagem • {sections.length} seções
                </span>
              </div>
            </div>

            {/* Renderização em blocos sequenciais para o Modo Rolagem */}
            {sections.map((section, sIdx) => {
              const isActive = sIdx === currentSectionIndex;
              const progressRatio = isActive
                ? Math.min(1, Math.max(0, sectionElapsedMs / (section.durationSeconds * 1000)))
                : sIdx < currentSectionIndex
                ? 1
                : 0;

              const remainingSec = isActive
                ? Math.max(0, Math.ceil(section.durationSeconds - sectionElapsedMs / 1000))
                : section.durationSeconds;

              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[sIdx] = el;
                  }}
                  onClick={() => jumpToSection(sIdx)}
                  className={`relative rounded-2xl transition-all duration-200 border overflow-hidden cursor-pointer ${
                    isActive
                      ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-500 ring-2 ring-blue-500/30 shadow-md shadow-blue-500/10"
                      : "bg-white dark:bg-[#181818] border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs"
                  }`}
                >
                  {/* Barra de Progresso Superior da Seção Ativa */}
                  <div className="w-full h-1 bg-neutral-200/60 dark:bg-neutral-800/80 overflow-hidden">
                    <div
                      className={`h-full transition-none ${
                        isActive
                          ? "bg-blue-500"
                          : sIdx < currentSectionIndex
                          ? "bg-neutral-400 dark:bg-neutral-600"
                          : "w-0"
                      }`}
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>

                  {/* Cabeçalho do Bloco da Seção */}
                  <div className="px-3.5 py-1.5 bg-neutral-100/60 dark:bg-neutral-900/60 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-xs sm:text-sm font-black uppercase tracking-wide px-2.5 py-0.5 rounded-lg ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {section.name}
                      </span>

                      {isActive && isPlaying && !isCountdown && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-sky-400 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Tocando
                        </span>
                      )}

                      {isActive && isCountdown && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                          <Timer className="w-3 h-3" />
                          Aguarde {countdownSeconds}s
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isActive ? `${remainingSec}s restantes` : `${section.durationSeconds}s`}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo da Cifra */}
                  <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 overflow-x-auto">
                    <pre
                      style={{ fontSize: `${fontSize}px`, lineHeight: "1.38" }}
                      className="font-mono whitespace-pre select-text text-neutral-800 dark:text-neutral-200 tracking-normal antialiased overflow-visible"
                    >
                      {section.lines.map((line, lIdx) => renderChordLine(line, lIdx))}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        /* ========================================================
           2. MODO FOCO: SEM ROLAGEM, DESTAQUE DE SLIDE DA SEÇÃO ATIVA
              E PRÉVIA DAS PRÓXIMAS SEÇÕES DINÂMICA PELO ESPAÇO DA TELA
           ======================================================== */
        <main
          ref={viewerContainerRef}
          className="flex-1 overflow-hidden px-2 sm:px-6 pt-2 sm:pt-3 pb-[68px] flex flex-col"
        >
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col gap-2 min-h-0">
            {/* CONTAINER DO CARD ATIVO COM TRANSIÇÃO COREOGRAFADA */}
            <div ref={activeCardRef} className="relative shrink-0">
              {/* CARD QUE ESTÁ SAINDO (SUBINDO EM FORMA DE SAÍDA) */}
              {exitingSection && (
                <div
                  key={`exit_${exitingSection.section.id}`}
                  className={`absolute inset-x-0 top-0 z-10 pointer-events-none rounded-2xl sm:rounded-3xl border-2 border-blue-500/30 bg-white/95 dark:bg-[#181818]/95 shadow-xl overflow-hidden ${
                    exitingSection.direction === "up"
                      ? "animate-focus-slide-up-exit"
                      : "animate-focus-slide-down-exit"
                  }`}
                >
                  <div className="px-3 sm:px-4 py-1.5 bg-neutral-100/70 dark:bg-neutral-900/70 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-neutral-400 text-white shadow-xs">
                      {exitingSection.section.name}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 font-bold">
                      Concluído
                    </span>
                  </div>

                  <div className="px-3 py-1.5 sm:px-4 sm:py-2 overflow-x-auto">
                    <pre
                      style={{
                        fontSize: `${Math.round(fontSize * 1.08)}px`,
                        lineHeight: "1.35",
                      }}
                      className="font-mono whitespace-pre select-text text-neutral-500 dark:text-neutral-400 tracking-normal antialiased overflow-visible font-medium"
                    >
                      {exitingSection.section.lines.map((line, lIdx) => renderChordLine(line, lIdx))}
                    </pre>
                  </div>
                </div>
              )}

              {/* CARD ATIVO (SUBINDO EM FORMA DE ENTRADA SUAVE) */}
              <div
                key={`active_${activeSection.id}`}
                className={`relative rounded-2xl sm:rounded-3xl border-2 border-blue-500 bg-white dark:bg-[#181818] shadow-xl shadow-blue-500/10 overflow-hidden ${
                  exitingSection
                    ? exitingSection.direction === "up"
                      ? "animate-focus-slide-up-enter"
                      : "animate-focus-slide-down-enter"
                    : ""
                }`}
              >
                {/* Barra de Progresso Superior do Slide */}
                <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-none"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (sectionElapsedMs / (activeSection.durationSeconds * 1000)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>

                {/* Cabeçalho do Card Foco */}
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/10 dark:bg-blue-950/30 border-b border-blue-500/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-blue-600 text-white shadow-xs">
                      {activeSection.name}
                    </span>

                    {isPlaying && !isCountdown && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-blue-600 dark:text-sky-400 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Tocando
                      </span>
                    )}

                    {isCountdown && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                        <Timer className="w-3 h-3" />
                        Iniciando ({countdownSeconds}s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono font-extrabold px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs bg-white dark:bg-neutral-800 text-blue-600 dark:text-sky-400 border border-blue-500/30 shadow-2xs">
                      <Clock className="w-3 h-3" />
                      {activeRemainingSeconds}s / {activeSection.durationSeconds}s
                    </span>
                  </div>
                </div>

                {/* CONTEÚDO DA CIFRA - BEM PRÓXIMO AO TEXTO */}
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 overflow-x-auto overflow-y-auto max-h-[48vh] sm:max-h-[58vh]">
                  <pre
                    style={{
                      fontSize: `${Math.round(fontSize * 1.08)}px`,
                      lineHeight: "1.35",
                    }}
                    className="font-mono whitespace-pre select-text text-neutral-900 dark:text-neutral-100 tracking-normal antialiased overflow-visible font-medium"
                  >
                    {activeSection.lines.map((line, lIdx) => renderChordLine(line, lIdx))}
                  </pre>
                </div>

                {/* Rodapé do Slide com Botões de Próximo / Anterior */}
                <div className="px-3 sm:px-4 py-1 bg-neutral-50 dark:bg-[#141414] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                  <button
                    type="button"
                    onClick={() => jumpToSection(currentSectionIndex - 1)}
                    disabled={currentSectionIndex === 0}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none font-bold text-xs transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Anterior</span>
                  </button>

                  <span className="font-mono font-bold text-[11px]">
                    {currentSectionIndex + 1} / {sections.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => jumpToSection(currentSectionIndex + 1)}
                    disabled={currentSectionIndex >= sections.length - 1}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none font-bold text-xs transition-colors text-blue-600 dark:text-sky-400"
                  >
                    <span className="hidden xs:inline">Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* PRÉVIA: PRÓXIMA SEÇÃO INTEIRA E, SE HOUVER ESPAÇO, PARTE DA SUBSEQUENTE (SEM ROLAGEM) */}
            {nextSection ? (
              <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col gap-2">
                {/* 1. PRÓXIMA SEÇÃO INTEIRA */}
                <div
                  key={`next_${nextSection.id}`}
                  onClick={() => jumpToSection(currentSectionIndex + 1)}
                  className="shrink-0 animate-slide-up-focus rounded-2xl sm:rounded-3xl border border-dashed border-amber-500/40 dark:border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 p-2.5 sm:p-3 opacity-90 hover:opacity-100 transition-all cursor-pointer group shadow-xs hover:border-amber-500/60"
                  title="Clique para avançar para a próxima seção"
                >
                  <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-amber-500/20 dark:border-amber-500/20">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span>A seguir:</span>
                        <span className="px-2 py-0.5 rounded-lg border font-bold bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300">
                          {nextSection.name}
                        </span>
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800">
                        ⏱ {nextSection.durationSeconds}s
                      </span>
                    </div>

                    <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-sky-400 group-hover:underline flex items-center gap-0.5 shrink-0">
                      <span>Avançar slide</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Conteúdo completo da próxima seção (inteira!) */}
                  <div className="overflow-x-auto">
                    <pre
                      style={{
                        fontSize: `${Math.round(fontSize * 0.95)}px`,
                        lineHeight: "1.35",
                      }}
                      className="font-mono whitespace-pre select-text text-neutral-800 dark:text-neutral-200 tracking-normal antialiased"
                    >
                      {nextSection.lines.map((line, lIdx) => renderChordLine(line, lIdx))}
                    </pre>
                  </div>
                </div>

                {/* 2. SEÇÃO SUBSEQUENTE (APARECE PARTE DELA SE HOUVER ESPAÇO LIVRE NA TELA) */}
                {subsequentSection && (
                  <div
                    key={`subsequent_${subsequentSection.id}`}
                    onClick={() => jumpToSection(currentSectionIndex + 2)}
                    className="shrink-0 animate-slide-up-focus rounded-2xl sm:rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-900/50 p-2.5 sm:p-3 opacity-60 hover:opacity-100 transition-all cursor-pointer group shadow-xs hover:border-sky-500/60"
                    title={`Clique para pular para ${subsequentSection.name}`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 mb-1.5 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <span>Depois:</span>
                          <span className="px-2 py-0.5 rounded-lg border font-bold bg-neutral-200/70 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                            {subsequentSection.name}
                          </span>
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800">
                          ⏱ {subsequentSection.durationSeconds}s
                        </span>
                      </div>

                      <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-sky-400 group-hover:underline flex items-center gap-0.5 shrink-0">
                        <span>Pular para esta</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Conteúdo da seção subsequente */}
                    <div className="overflow-x-auto">
                      <pre
                        style={{
                          fontSize: `${Math.round(fontSize * 0.9)}px`,
                          lineHeight: "1.35",
                        }}
                        className="font-mono whitespace-pre select-text text-neutral-700 dark:text-neutral-300 tracking-normal antialiased"
                      >
                        {subsequentSection.lines.map((line, lIdx) => renderChordLine(line, lIdx))}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Gradiente suave na borda inferior para desvanecer com elegância o que estiver no limite da tela */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-50 dark:from-[#121212] to-transparent z-10" />
              </div>
            ) : (
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Última seção da música</span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* DRAWER LATERAL / FLUTUANTE PARA ESCOLHER MÚSICA DO SETLIST */}
      {showSongDrawer && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end"
          onClick={() => setShowSongDrawer(false)}
        >
          <div
            className="w-full max-w-xs h-full bg-white dark:bg-[#1a1a1a] border-l border-neutral-200 dark:border-neutral-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Music4 className="w-5 h-5 text-blue-500" />
                Ordem do Culto
              </h3>
              <button
                type="button"
                onClick={() => setShowSongDrawer(false)}
                className="text-xs px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {selectedSongsList.map((song, index) => {
                const isCurrent = index === currentSongIndex;
                const isFirst = index === 0;
                const isLast = index === selectedSongsList.length - 1;

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      goToSong(index);
                      setShowSongDrawer(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? "bg-white text-blue-600"
                            : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-xs truncate leading-tight">{song.title}</p>
                        <p
                          className={`text-[11px] truncate ${
                            isCurrent ? "text-blue-100" : "text-neutral-500"
                          }`}
                        >
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {song.key && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCurrent
                              ? "bg-blue-700 text-white"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {song.key}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSongUp(song.id);
                        }}
                        disabled={isFirst}
                        className={`p-1 rounded hover:bg-black/10 disabled:opacity-20 ${
                          isCurrent ? "text-white" : "text-neutral-400"
                        }`}
                        title="Subir na ordem"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSongDown(song.id);
                        }}
                        disabled={isLast}
                        className={`p-1 rounded hover:bg-black/10 disabled:opacity-20 ${
                          isCurrent ? "text-white" : "text-neutral-400"
                        }`}
                        title="Descer na ordem"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FLUTUANTE DE NAVEGAÇÃO DE MÚSICAS */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 px-3 sm:px-6 py-2.5 bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800/80 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Música Anterior */}
          <button
            type="button"
            onClick={prevSong}
            disabled={currentSongIndex === 0}
            className="flex-1 max-w-[160px] py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 text-neutral-800 dark:text-neutral-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="truncate">Anterior</span>
          </button>

          {/* Indicador Central */}
          <div className="flex-1 text-center min-w-0 px-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white truncate block">
              {currentSong.title}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
              Música {currentSongIndex + 1} de {selectedSongsList.length}
            </span>
          </div>

          {/* Próxima Música */}
          <button
            type="button"
            onClick={nextSong}
            disabled={currentSongIndex >= selectedSongsList.length - 1}
            className="flex-1 max-w-[160px] py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 shadow-xs"
          >
            <span className="truncate">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// Renderizador linha por linha com estilização de acordes e anotações
function renderChordLine(line: string, lIdx: number) {
  // 1. Linha de anotação de bloco (// comentário, ATENÇÃO:, DINÂMICA:, OBS:, etc.)
  const blockAnnotation = getLineAnnotationType(line);
  if (blockAnnotation) {
    const style = ANNOTATION_STYLES[blockAnnotation.color];
    return (
      <div
        key={lIdx}
        className={`my-2 p-2 sm:px-3 sm:py-1.5 rounded-lg border flex items-center gap-2 select-text ${style.bg} ${style.border}`}
      >
        {blockAnnotation.label && (
          <span
            className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 ${style.badge}`}
          >
            {blockAnnotation.label}
          </span>
        )}
        <span className={`text-xs sm:text-sm font-sans ${style.text}`}>
          {blockAnnotation.text}
        </span>
      </div>
    );
  }

  // 2. Linha identificada como acordes musicais
  if (isChordLine(line)) {
    const inlineParts = parseInlineAnnotations(line);
    return (
      <span
        key={lIdx}
        className="block font-bold text-blue-600 dark:text-sky-400 select-text tracking-wide"
      >
        {inlineParts.map((part, pIdx) => {
          if (part.isAnnotation && part.color) {
            const style = ANNOTATION_STYLES[part.color];
            return (
              <span
                key={pIdx}
                className={`px-1.5 py-0.5 mx-0.5 rounded text-xs font-sans font-bold border ${style.bg} ${style.text} ${style.border}`}
              >
                {part.text}
              </span>
            );
          }
          return <React.Fragment key={pIdx}>{part.text}</React.Fragment>;
        })}
      </span>
    );
  }

  // 3. Linha normal de letra da música (com suporte a tags {cor: texto})
  const inlineParts = parseInlineAnnotations(line);
  const hasAnnotations = inlineParts.some((p) => p.isAnnotation);

  if (hasAnnotations) {
    return (
      <span key={lIdx} className="block select-text">
        {inlineParts.map((part, pIdx) => {
          if (part.isAnnotation && part.color) {
            const style = ANNOTATION_STYLES[part.color];
            return (
              <span
                key={pIdx}
                className={`px-1.5 py-0.5 mx-0.5 rounded text-xs font-sans font-bold border ${style.bg} ${style.text} ${style.border}`}
              >
                {part.text}
              </span>
            );
          }
          return <React.Fragment key={pIdx}>{part.text}</React.Fragment>;
        })}
      </span>
    );
  }

  return (
    <span key={lIdx} className="block select-text">
      {line || "\u00A0"}
    </span>
  );
}
