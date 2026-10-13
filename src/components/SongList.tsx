"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Play,
  Music,
  CheckCircle2,
  ListMusic,
  ArrowUp,
  ArrowDown,
  Layers,
  ArrowUpDown,
  X,
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { Song } from "@/types/song";
import { SongModal } from "./SongModal";

export function SongList() {
  const {
    songs,
    selectedSongIds,
    selectedSongsList,
    toggleSelectSong,
    selectAllSongs,
    clearSelection,
    startSetlist,
    addSong,
    updateSong,
    deleteSong,
    moveSongUp,
    moveSongDown,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<"library" | "setlist">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Filtragem da Biblioteca
  const filteredSongs = songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.key && song.key.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    setEditingSong(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSong(song);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja remover a cifra de "${title}"?`)) {
      deleteSong(id);
    }
  };

  const handleQuickPlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSongIds.includes(song.id)) {
      toggleSelectSong(song.id);
    }
    startSetlist();
  };

  const handleSaveSong = (songData: {
    title: string;
    artist: string;
    key?: string;
    chords: string;
  }) => {
    if (editingSong) {
      updateSong(editingSong.id, songData);
    } else {
      addSong(songData);
    }
  };

  const allSelected = songs.length > 0 && selectedSongIds.length === songs.length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-32 pt-4">
      {/* Top Banner de Informação e Ações Rápidas */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <ListMusic className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Repertório do Louvor
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Selecione e ordene a sequência exata das músicas para o culto.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Adicionar Cifra
        </button>
      </div>

      {/* ABAS: BIBLIOTECA vs ORDEM DO CULTO */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-2xl mb-6 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "library"
              ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Biblioteca Geral ({songs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("setlist")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "setlist"
              ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>Ordem do Culto</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
              selectedSongIds.length > 0
                ? "bg-blue-600 text-white"
                : "bg-neutral-300 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {selectedSongIds.length}
          </span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA: ORDEM DO CULTO (SETLIST REORDENÁVEL) */}
      {activeTab === "setlist" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Sequência de Músicas do Culto</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Use os botões de subir (↑) e descer (↓) para ajustar a ordem em que as cifras aparecerão no palco.
              </p>
            </div>

            {selectedSongIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-neutral-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Limpar Setlist
              </button>
            )}
          </div>

          {selectedSongsList.length === 0 ? (
            <div className="p-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/30 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                <ArrowUpDown className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                Nenhuma música selecionada para o culto
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
                Vá para a aba Biblioteca Geral e marque as músicas que serão tocadas no culto de hoje.
              </p>
              <button
                onClick={() => setActiveTab("library")}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-500 transition-colors"
              >
                Ir para a Biblioteca e Selecionar
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedSongsList.map((song, index) => {
                const isFirst = index === 0;
                const isLast = index === selectedSongsList.length - 1;

                return (
                  <div
                    key={song.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 shadow-sm hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Número da Ordem */}
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-base flex items-center justify-center shrink-0 border border-blue-500/20">
                        {index + 1}º
                      </div>

                      {/* Dados da Música */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                            {song.title}
                          </h3>
                          {song.key && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                              Tom: {song.key}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Controles de Reordenação e Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botão Subir */}
                      <button
                        type="button"
                        onClick={() => moveSongUp(song.id)}
                        disabled={isFirst}
                        title={isFirst ? "Já é a primeira do culto" : "Mover para cima"}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isFirst
                            ? "opacity-25 cursor-not-allowed border-transparent text-neutral-400"
                            : "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Botão Descer */}
                      <button
                        type="button"
                        onClick={() => moveSongDown(song.id)}
                        disabled={isLast}
                        title={isLast ? "Já é a última do culto" : "Mover para baixo"}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isLast
                            ? "opacity-25 cursor-not-allowed border-transparent text-neutral-400"
                            : "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                        }`}
                      >
                        <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Botão Remover do Culto */}
                      <button
                        type="button"
                        onClick={() => toggleSelectSong(song.id)}
                        title="Remover esta música do culto de hoje"
                        className="p-2.5 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CONTEÚDO DA ABA: BIBLIOTECA GERAL COM BUSCA E CHECKBOXES */
        <div>
          {/* Barra de Busca e Filtros */}
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por música, artista ou tom (ex: Isaías Saad, G)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Barra de Seleção e Contadores */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={allSelected ? clearSelection : selectAllSongs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                  {allSelected ? (
                    <>
                      <Square className="w-4 h-4" />
                      Desmarcar todas
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                      Selecionar todas ({songs.length})
                    </>
                  )}
                </button>
              </div>

              <div className="text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-2">
                <span>
                  <strong className="text-blue-600 dark:text-blue-400">{selectedSongIds.length}</strong> de {songs.length} no Setlist
                </span>
                {selectedSongIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("setlist")}
                    className="text-xs text-blue-600 dark:text-blue-400 underline font-semibold ml-1"
                  >
                    Ver/Ajustar Ordem →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Músicas da Biblioteca */}
          {filteredSongs.length === 0 ? (
            <div className="p-10 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                Nenhuma cifra encontrada
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
                {searchQuery
                  ? "Tente ajustar o termo da sua busca."
                  : "Sua biblioteca está vazia. Adicione novas músicas para montar o setlist do culto."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenAdd}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-500 transition-colors"
                >
                  Cadastrar Nova Cifra
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSongs.map((song) => {
                const isSelected = selectedSongIds.includes(song.id);
                const orderIndex = selectedSongIds.indexOf(song.id);

                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSelectSong(song.id)}
                    className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border select-none ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-500/50 shadow-sm shadow-blue-500/10"
                        : "bg-white dark:bg-neutral-900/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox grande com toque facilitado */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectSong(song.id);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-transparent hover:border-blue-400"
                          }`}
                          aria-label={isSelected ? "Desmarcar do setlist" : "Marcar para setlist"}
                        >
                          <CheckCircle2 className={`w-4 h-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </div>

                      {/* Informações da Música */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold text-base truncate transition-colors ${
                              isSelected
                                ? "text-blue-950 dark:text-blue-100 font-bold"
                                : "text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            {song.title}
                          </h3>
                          {song.key && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Tom: {song.key}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-medium">
                            {song.artist}
                          </p>

                          {/* Badge de Ordem no Culto quando selecionada */}
                          {isSelected && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                              {orderIndex + 1}ª do Culto
                            </span>
                          )}
                        </div>

                        {/* Prévia da Cifra */}
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-2 font-mono bg-neutral-100/60 dark:bg-black/30 p-1.5 rounded-md">
                          {song.chords.split("\n").filter((l) => l.trim()).slice(0, 2).join(" • ")}
                        </p>
                      </div>

                      {/* Ações do Card */}
                      <div className="flex items-center gap-1 self-start">
                        {isSelected && (
                          <div className="flex items-center mr-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => moveSongUp(song.id)}
                              disabled={orderIndex <= 0}
                              title="Subir na ordem do culto"
                              className={`p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 ${
                                orderIndex <= 0 ? "opacity-20 cursor-not-allowed" : "hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              }`}
                            >
                              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSongDown(song.id)}
                              disabled={orderIndex >= selectedSongIds.length - 1}
                              title="Descer na ordem do culto"
                              className={`p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 ${
                                orderIndex >= selectedSongIds.length - 1 ? "opacity-20 cursor-not-allowed" : "hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              }`}
                            >
                              <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleQuickPlay(song, e)}
                          title="Visualizar agora no palco"
                          className="p-2 rounded-xl text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(song, e)}
                          title="Editar cifra"
                          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(song.id, song.title, e)}
                          title="Excluir cifra"
                          className="p-2 rounded-xl text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Botão Flutuante (Floating Action Bar) para Iniciar Setlist */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#121212] dark:via-[#121212]/95 dark:to-transparent backdrop-blur-sm pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto flex gap-2">
          {activeTab === "library" && selectedSongIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("setlist")}
              className="py-4 px-4 rounded-2xl font-bold text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-1.5 shadow-xl transition-all"
              title="Ajustar ordem do culto"
            >
              <ArrowUpDown className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Ordem</span>
            </button>
          )}

          <button
            type="button"
            onClick={startSetlist}
            disabled={selectedSongIds.length === 0}
            className={`flex-1 py-4 px-6 rounded-2xl font-bold text-base shadow-2xl flex items-center justify-between transition-all duration-200 active:scale-98 ${
              selectedSongIds.length > 0
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Iniciar Setlist</div>
                <div className="text-xs font-normal opacity-90">
                  {selectedSongIds.length === 0
                    ? "Selecione ao menos 1 música"
                    : `${selectedSongIds.length} ${
                        selectedSongIds.length === 1 ? "música na ordem" : "músicas na sequência"
                      }`}
                </div>
              </div>
            </div>

            {selectedSongIds.length > 0 && (
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                Modo Palco →
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Adicionar / Editar */}
      <SongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSong}
        initialData={editingSong}
      />
    </div>
  );
}
