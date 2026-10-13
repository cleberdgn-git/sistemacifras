"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Music2, FileText, User, Sparkles, Palette, Eraser } from "lucide-react";
import { Song } from "@/types/song";

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (songData: { title: string; artist: string; key?: string; chords: string }) => void;
  initialData?: Song | null;
}

export function SongModal({ isOpen, onClose, onSave, initialData }: SongModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("");
  const [chords, setChords] = useState("");
  const [errors, setErrors] = useState<{ title?: string; artist?: string; chords?: string }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Aplica a cor no texto selecionado ou insere modelo na posição do cursor
  const applyColorToSelection = (colorName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = chords.substring(start, end);

    let newChords = "";
    let newCursorStart = 0;
    let newCursorEnd = 0;

    if (selectedText.length > 0) {
      // Se o texto já tinha tag {qualquer_cor: texto}, limpa antes de reaplicar
      const cleanSelected = selectedText.replace(
        /^\{(?:amarelo|verde|vermelho|azul|roxo|laranja|rosa|yellow|green|red|blue|purple|orange|pink|obs):\s*([^}]+)\}$/i,
        "$1"
      );
      const formatted = `{${colorName}: ${cleanSelected}}`;
      newChords = chords.substring(0, start) + formatted + chords.substring(end);
      newCursorStart = start;
      newCursorEnd = start + formatted.length;
    } else {
      // Sem seleção: insere template e seleciona o texto da anotação para digitação imediata
      const sample = "Anotação";
      const template = `{${colorName}: ${sample}}`;
      newChords = chords.substring(0, start) + template + chords.substring(end);
      newCursorStart = start + colorName.length + 3; // posição inicial de "Anotação"
      newCursorEnd = newCursorStart + sample.length;
    }

    setChords(newChords);

    // Reativa o foco e seleciona a área correta
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Remove a formatação de cor do trecho selecionado
  const removeColorFromSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = chords.substring(start, end);
    if (!selectedText) return;

    const cleaned = selectedText.replace(
      /\{(?:amarelo|verde|vermelho|azul|roxo|laranja|rosa|yellow|green|red|blue|purple|orange|pink|obs):\s*([^}]+)\}/gi,
      "$1"
    );

    const newChords = chords.substring(0, start) + cleaned + chords.substring(end);
    setChords(newChords);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + cleaned.length);
    }, 0);
  };

  // Insere ou transforma em bloco de anotação (ATENÇÃO:, DINÂMICA:, //, OBS:)
  const applyBlockAnnotation = (prefix: string, defaultText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = chords.substring(start, end).trim();

    const lineText = selectedText ? `${prefix} ${selectedText}` : `${prefix} ${defaultText}`;
    const newChords =
      chords.substring(0, start) +
      (start > 0 && chords[start - 1] !== "\n" ? "\n" : "") +
      lineText +
      (end < chords.length && chords[end] !== "\n" ? "\n" : "") +
      chords.substring(end);

    setChords(newChords);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setArtist(initialData.artist);
      setKey(initialData.key || "");
      setChords(initialData.chords);
    } else {
      setTitle("");
      setArtist("");
      setKey("");
      setChords("");
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; artist?: string; chords?: string } = {};

    if (!title.trim()) newErrors.title = "O título é obrigatório";
    if (!artist.trim()) newErrors.artist = "O artista/ministério é obrigatório";
    if (!chords.trim()) newErrors.chords = "O texto da cifra é obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim().toUpperCase() || undefined,
      chords: chords.trim(),
    });

    onClose();
  };

  const handleInsertTemplate = () => {
    if (chords.trim() && !window.confirm("Deseja substituir o conteúdo atual pelo modelo?")) {
      return;
    }
    setChords(`[Intro] G  C  Em  D

[Primeira Parte]
G                  C
 Quando olho para a cruz
Em                 D
 Vejo Tua graça sem fim
G                   C
 Teu amor me resgatou
Em              D
 Hoje vivo para Ti

[Refrão]
C         G
 Santo, Tu és Santo
Em         D
 Digno de adoração
C            G
 Meu coração Te exalta
Em           D        G
 Reina sobre nós, Senhor`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-blue-500/30 bg-neutral-950 shrink-0 ring-1 ring-blue-500/20">
              <img
                src="/app-icon.jpg?v=3"
                alt="Ícone"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {initialData ? "Editar Cifra" : "Adicionar Nova Cifra"}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Cadastre e formate para o visualizador de palco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Título */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Título da Música *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Bondade de Deus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.title
                      ? "border-red-500 focus:ring-red-500/30"
                      : "border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
              </div>
              {errors.title && (
                <span className="text-xs text-red-500 mt-1 block">{errors.title}</span>
              )}
            </div>

            {/* Artista */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Artista / Ministério *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Isaías Saad"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.artist
                      ? "border-red-500 focus:ring-red-500/30"
                      : "border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
              </div>
              {errors.artist && (
                <span className="text-xs text-red-500 mt-1 block">{errors.artist}</span>
              )}
            </div>

            {/* Tom */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Tom
              </label>
              <input
                type="text"
                placeholder="Ex: G, Dm"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                maxLength={5}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-semibold text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Cifra */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Texto da Cifra (Acordes + Letra) *
              </label>
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Inserir modelo de exemplo
              </button>
            </div>

            {/* Barra de Cores para Seleção de Texto */}
            <div className="bg-neutral-100/80 dark:bg-neutral-900/90 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 mb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  <span>Selecione um texto e clique na cor:</span>
                </div>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={removeColorFromSelection}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  title="Remove a cor do texto selecionado"
                >
                  <Eraser className="w-3 h-3" />
                  Limpar cor da seleção
                </button>
              </div>

              {/* Botões de Cores com clique direto na seleção */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("vermelho")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  title="Aplica cor Vermelha no texto selecionado (Paradas e Alertas)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  Vermelho
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("amarelo")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-400 hover:text-neutral-900 transition-all active:scale-95"
                  title="Aplica cor Amarela no texto selecionado (Observações e Repetições)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  Amarelo
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("verde")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                  title="Aplica cor Verde no texto selecionado (Arranjos e Instrumentos)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Verde
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("azul")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all active:scale-95"
                  title="Aplica cor Azul no texto selecionado (Solos e Convenções)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  Azul
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("roxo")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white transition-all active:scale-95"
                  title="Aplica cor Roxa no texto selecionado (Dinâmica e Intensidade)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  Roxo
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyColorToSelection("laranja")}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-white transition-all active:scale-95"
                  title="Aplica cor Laranja no texto selecionado (Modulações e Avisos)"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                  Laranja
                </button>
              </div>

              {/* Inserir linhas de bloco completas */}
              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-[10px] text-neutral-400 font-medium mr-1">Linha inteira:</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockAnnotation("ATENÇÃO:", "Parada no 3º tempo")}
                  className="text-[11px] px-2 py-0.5 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold"
                >
                  + ATENÇÃO:
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockAnnotation("DINÂMICA:", "Suave, só teclado e voz")}
                  className="text-[11px] px-2 py-0.5 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-semibold"
                >
                  + DINÂMICA:
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlockAnnotation("//", "Entra violão dedilhado")}
                  className="text-[11px] px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                >
                  + Comentário (//)
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={chords}
              onChange={(e) => setChords(e.target.value)}
              placeholder="Cole aqui a cifra completa...&#10;&#10;[Intro] G  C  G&#10;// Entra teclado suave&#10;&#10;G               C&#10;Te amo, Deus, Tua graça nunca falha... {vermelho: Parada!}&#10;&#10;ATENÇÃO: Repete refrão 2x no final"
              rows={12}
              spellCheck={false}
              className={`w-full flex-1 p-3.5 rounded-xl border bg-neutral-50 dark:bg-black/50 text-neutral-900 dark:text-neutral-100 font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto focus:outline-none focus:ring-2 transition-all ${
                errors.chords
                  ? "border-red-500 focus:ring-red-500/30"
                  : "border-neutral-300 dark:border-neutral-700 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
            />
            {errors.chords && (
              <span className="text-xs text-red-500 mt-1 block">{errors.chords}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Salvar Cifra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

