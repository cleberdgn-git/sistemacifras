"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  List,
  Music4,
  Volume2,
  Sliders,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { ThemeToggle } from "./ThemeToggle";
import {
  isChordLine,
  isSectionHeader,
  transposeChordsText,
  getLineAnnotationType,
  parseInlineAnnotations,
  ANNOTATION_STYLES,
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
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 1 = normal, 2 = rápido, 0.5 = lento
  const [showSongDrawer, setShowSongDrawer] = useState<boolean>(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resetar transposição de tom quando muda de música
  useEffect(() => {
    setSemitoneOffset(0);
    setIsAutoScrolling(false);
    if (viewerContainerRef.current) {
      viewerContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSongIndex]);

  // Atalhos de teclado para palco (Setas e Espaço)
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
        setIsAutoScrolling((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSong, prevSong, isFullscreen, toggleFullscreen]);

  // Lógica do Auto-scroll suave
  useEffect(() => {
    if (isAutoScrolling) {
      const step = scrollSpeed;
      scrollIntervalRef.current = setInterval(() => {
        if (viewerContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = viewerContainerRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 2) {
            setIsAutoScrolling(false);
          } else {
            viewerContainerRef.current.scrollTop += step;
          }
        }
      }, 40);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Cifra com transposição aplicada
  const transposedChords = useMemo(() => {
    if (!currentSong) return "";
    return transposeChordsText(currentSong.chords, semitoneOffset);
  }, [currentSong, semitoneOffset]);

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

  // Renderizador linha por linha para estilizar acordes mantendo alinhamento perfeito de colunas
  const chordLines = transposedChords.split("\n");

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col select-text transition-colors duration-200 ${
        theme === "dark" ? "bg-[#121212] text-neutral-100" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      {/* BARRA SUPERIOR DO PALCO (Stage Top Bar) */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/90 dark:bg-[#161616]/95 backdrop-blur-md z-20">
        {/* Lado Esquerdo: Voltar & Título */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={exitViewer}
            className="p-2 -ml-1 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 font-medium text-xs sm:text-sm"
            title="Voltar para a biblioteca"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Biblioteca</span>
          </button>

          <div className="h-5 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />

          {/* Info da Música e Contador de Setlist */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white shrink-0 shadow-sm">
                {currentSongIndex + 1} de {selectedSongsList.length}
              </span>
              <h1 className="font-bold text-sm sm:text-base truncate tracking-tight text-neutral-900 dark:text-white">
                {currentSong.title}
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {currentSong.artist}
              {currentSong.key && (
                <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                  • Tom: {currentSong.key} {semitoneOffset !== 0 ? `(${semitoneOffset > 0 ? "+" : ""}${semitoneOffset})` : ""}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Lado Direito: Ferramentas do Palco (Fonte, Tom, AutoScroll, Fullscreen, Tema) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Controle de Tamanho da Fonte */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={decreaseFontSize}
              title="Diminuir fonte (A-)"
              className="px-2.5 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            >
              A-
            </button>
            <span className="text-[11px] font-mono px-1 text-neutral-400 select-none hidden sm:inline">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={increaseFontSize}
              title="Aumentar fonte (A+)"
              className="px-2.5 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"
            >
              A+
            </button>
          </div>

          {/* Transposição de Tom (- / +) */}
          <div className="hidden sm:flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setSemitoneOffset((prev) => prev - 1)}
              title="Descer 1 semitom"
              className="px-2 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 rounded-lg transition-colors"
            >
              -1
            </button>
            <span className="text-[10px] font-semibold px-1 text-neutral-400">Tom</span>
            <button
              type="button"
              onClick={() => setSemitoneOffset((prev) => prev + 1)}
              title="Subir 1 semitom"
              className="px-2 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-500 rounded-lg transition-colors"
            >
              +1
            </button>
          </div>

          {/* Auto-Scroll */}
          <button
            type="button"
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            title={isAutoScrolling ? "Pausar rolagem automática" : "Rolar automaticamente (mãos livres)"}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium ${
              isAutoScrolling
                ? "bg-emerald-600 text-white animate-pulse"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isAutoScrolling ? "Rolando" : "Auto-scroll"}
            </span>
          </button>

          {/* Menu Rápido de Músicas do Setlist */}
          <button
            type="button"
            onClick={() => setShowSongDrawer(!showSongDrawer)}
            title="Ver lista de músicas do culto"
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Tela Cheia (Fullscreen API nativa) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia (Sem Distrações)"}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Alternador de Tema */}
          <ThemeToggle />
        </div>
      </header>

      {/* ÁREA CENTRAL: O TEXTO DA CIFRA COM PRE / FONT-MONO */}
      <main
        ref={viewerContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto px-4 sm:px-8 py-6 pb-24 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho da Música no Palco */}
          <div className="mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              {currentSong.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-semibold">
                {currentSong.artist}
              </span>
              {currentSong.key && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Tom Original: {currentSong.key}
                  {semitoneOffset !== 0 && (
                    <span className="ml-1 text-blue-500 font-extrabold">
                      (Tocado: {semitoneOffset > 0 ? `+${semitoneOffset}` : semitoneOffset})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* RENDERIZAÇÃO DA CIFRA DENTRO DA TAG <pre> COM 'font-mono' */}
          <pre
            style={{ fontSize: `${fontSize}px`, lineHeight: "1.55" }}
            className="font-mono whitespace-pre select-text text-neutral-800 dark:text-neutral-200 tracking-normal antialiased pb-20 leading-relaxed overflow-visible"
          >
            {chordLines.map((line, idx) => {
              // 1. Linha de anotação de bloco (// comentário, ATENÇÃO:, DINÂMICA:, OBS:, etc.)
              const blockAnnotation = getLineAnnotationType(line);
              if (blockAnnotation) {
                const style = ANNOTATION_STYLES[blockAnnotation.color];
                return (
                  <div
                    key={idx}
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

              // 2. Seção estrutural [Intro], [Refrão], [Ponte], etc.
              if (isSectionHeader(line)) {
                return (
                  <span
                    key={idx}
                    className="block font-bold text-amber-600 dark:text-amber-400 my-2 select-text opacity-95"
                  >
                    {line}
                  </span>
                );
              }

              // 3. Linha identificada como acordes musicais
              if (isChordLine(line)) {
                const inlineParts = parseInlineAnnotations(line);
                return (
                  <span
                    key={idx}
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

              // 4. Linha normal de letra da música (com suporte a tags {cor: texto})
              const inlineParts = parseInlineAnnotations(line);
              const hasAnnotations = inlineParts.some((p) => p.isAnnotation);

              if (hasAnnotations) {
                return (
                  <span key={idx} className="block select-text">
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
                <span key={idx} className="block select-text">
                  {line || "\u00A0"}
                </span>
              );
            })}
          </pre>
        </div>
      </main>

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
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors ${
                      isCurrent
                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        goToSong(index);
                        setShowSongDrawer(false);
                      }}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-sm truncate">{song.title}</div>
                        <div className="text-[11px] opacity-75 truncate">{song.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {song.key && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isCurrent ? "bg-white/20 text-white" : "bg-neutral-200 dark:bg-neutral-800"
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
                        title="Subir na ordem"
                        className={`p-1 rounded transition-colors ${
                          isFirst ? "opacity-20 cursor-not-allowed" : "hover:bg-black/20"
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSongDown(song.id);
                        }}
                        disabled={isLast}
                        title="Descer na ordem"
                        className={`p-1 rounded transition-colors ${
                          isLast ? "opacity-20 cursor-not-allowed" : "hover:bg-black/20"
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR DE NAVEGAÇÃO DO PALCO (Stage Bottom Navigation) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 p-2.5 sm:p-4 bg-white/95 dark:bg-[#161616]/95 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Botão Anterior */}
          <button
            type="button"
            onClick={prevSong}
            disabled={currentSongIndex === 0}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base transition-all active:scale-95 ${
              currentSongIndex === 0
                ? "opacity-30 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 shadow-sm"
            }`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            <span>Anterior</span>
          </button>

          {/* Indicador Central da Posição */}
          <div className="text-center px-2 shrink-0">
            <div className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400">
              {currentSongIndex + 1} / {selectedSongsList.length}
            </div>
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium hidden xs:block">
              Setlist do Culto
            </div>
          </div>

          {/* Botão Próxima */}
          <button
            type="button"
            onClick={nextSong}
            disabled={currentSongIndex === selectedSongsList.length - 1}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm sm:text-base transition-all active:scale-95 ${
              currentSongIndex === selectedSongsList.length - 1
                ? "opacity-30 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 text-neutral-400"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
            }`}
          >
            <span>Próxima</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </footer>
    </div>
  );
}

