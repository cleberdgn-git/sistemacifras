"use client";

import React, { useState, useEffect } from "react";
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
  MoreVertical,
  Filter,
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
    goToSong,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<"library" | "setlist">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOnlySelected, setFilterOnlySelected] = useState(false);
  const [openMenuSongId, setOpenMenuSongId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Fecha menu de contexto de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuSongId(null);
    if (openMenuSongId) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuSongId]);

  // Filtragem da Biblioteca (com busca e filtro rápido "Apenas do Culto")
  const filteredSongs = songs.filter((song) => {
    if (filterOnlySelected && !selectedSongIds.includes(song.id)) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      (song.key && song.key.toLowerCase().includes(q))
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
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 pb-28 sm:pb-32 pt-3 sm:pt-4">
      {/* Top Header: Compacto no mobile e completo no desktop */}
      <div className="mb-3.5 sm:mb-5 flex items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <ListMusic className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Repertório</span>
            <span className="text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              {songs.length}
            </span>
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Selecione e ordene a sequência exata das músicas para o culto.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 active:scale-95 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Cifra</span>
        </button>
      </div>

      {/* ABAS: BIBLIOTECA vs ORDEM DO CULTO */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-2xl mb-3.5 sm:mb-5 max-w-md w-full">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "library"
              ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Biblioteca</span>
          <span className="text-[10px] sm:text-[11px] opacity-75">({songs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("setlist")}
          className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "setlist"
              ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Ordem do Culto</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
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
            <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/30 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2.5 sm:mb-3">
                <ArrowUpDown className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200">
                Nenhuma música no setlist do culto
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-3.5">
                Vá para a aba Biblioteca e selecione as músicas que serão tocadas.
              </p>
              <button
                onClick={() => setActiveTab("library")}
                type="button"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-500 transition-colors shadow-xs"
              >
                Ir para a Biblioteca
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5">
              {selectedSongsList.map((song, index) => {
                const isFirst = index === 0;
                const isLast = index === selectedSongsList.length - 1;

                return (
                  <div
                    key={song.id}
                    className="p-3 sm:p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2.5 sm:gap-3 shadow-xs hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Número da Ordem */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs sm:text-base flex items-center justify-center shrink-0 border border-blue-500/20">
                        {index + 1}º
                      </div>

                      {/* Dados da Música */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate leading-tight">
                            {song.title}
                          </h3>
                          {song.key && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] sm:text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              {song.key}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Controles de Reordenação e Ações */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Botão Play rápido para testar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToSong(index);
                          startSetlist();
                        }}
                        title="Tocar a partir desta música no palco"
                        className="p-2 rounded-xl text-blue-600 dark:text-sky-400 bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 active:scale-90 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Botão Subir */}
                      <button
                        type="button"
                        onClick={() => moveSongUp(song.id)}
                        disabled={isFirst}
                        title={isFirst ? "Já é a primeira do culto" : "Mover para cima"}
                        className={`p-2 rounded-xl border transition-all ${
                          isFirst
                            ? "opacity-20 cursor-not-allowed border-transparent text-neutral-400"
                            : "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Botão Descer */}
                      <button
                        type="button"
                        onClick={() => moveSongDown(song.id)}
                        disabled={isLast}
                        title={isLast ? "Já é a última do culto" : "Mover para baixo"}
                        className={`p-2 rounded-xl border transition-all ${
                          isLast
                            ? "opacity-20 cursor-not-allowed border-transparent text-neutral-400"
                            : "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Botão Remover do Culto */}
                      <button
                        type="button"
                        onClick={() => toggleSelectSong(song.id)}
                        title="Remover do culto"
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
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
          <div className="mb-4 sm:mb-5 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar música, artista ou tom (ex: Isaías Saad, G)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Barra de Seleção e Filtros Rápidos */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={allSelected ? clearSelection : selectAllSongs}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-semibold text-[11px] sm:text-xs shrink-0"
                >
                  {allSelected ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Desmarcar todas</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>Marcar todas ({songs.length})</span>
                    </>
                  )}
                </button>

                {/* Filtro Rápido: Mostrar Apenas Músicas Selecionadas */}
                {selectedSongIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterOnlySelected((prev) => !prev)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-[11px] sm:text-xs transition-all shrink-0 border ${
                      filterOnlySelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <Filter className="w-3 h-3" />
                    <span>No Culto ({selectedSongIds.length})</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium shrink-0 flex items-center gap-1">
                <span>
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedSongIds.length}</strong> de {songs.length}
                </span>
                {selectedSongIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("setlist")}
                    className="text-blue-600 dark:text-blue-400 underline font-bold ml-1 hidden xs:inline"
                  >
                    Ordem →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Músicas da Biblioteca */}
          {filteredSongs.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2.5 sm:mb-3">
                <Music className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200">
                Nenhuma cifra encontrada
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-3.5">
                {searchQuery
                  ? "Tente ajustar o termo da sua busca."
                  : filterOnlySelected
                  ? "Nenhuma música está marcada para o culto de hoje."
                  : "Sua biblioteca está vazia. Adicione novas músicas para montar o setlist."}
              </p>
              <div className="flex gap-2">
                {filterOnlySelected ? (
                  <button
                    onClick={() => setFilterOnlySelected(false)}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-500 transition-colors"
                  >
                    Mostrar Todas
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAdd}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-500 transition-colors"
                  >
                    Cadastrar Nova Cifra
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
              {filteredSongs.map((song) => {
                const isSelected = selectedSongIds.includes(song.id);
                const orderIndex = selectedSongIds.indexOf(song.id);
                const isMenuOpen = openMenuSongId === song.id;

                return (
                  <div
                    key={song.id}
                    onClick={() => toggleSelectSong(song.id)}
                    className={`group relative rounded-2xl p-3 sm:p-3.5 transition-all duration-150 cursor-pointer border select-none ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/25 border-blue-500/50 shadow-xs ring-1 ring-blue-500/15"
                        : "bg-white dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Checkbox grande com toque facilitado */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectSong(song.id);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border shrink-0 ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                            : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-transparent hover:border-blue-400"
                        }`}
                        aria-label={isSelected ? "Desmarcar do setlist" : "Marcar para setlist"}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      </button>

                      {/* Informações da Música */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h3
                            className={`font-bold text-sm sm:text-base truncate transition-colors leading-tight ${
                              isSelected
                                ? "text-blue-950 dark:text-blue-100 font-extrabold"
                                : "text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            {song.title}
                          </h3>
                          {song.key && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] sm:text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              {song.key}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {song.artist}
                          </p>

                          {/* Badge de Ordem no Culto quando selecionada */}
                          {isSelected && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white leading-none">
                              {orderIndex + 1}º
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações do Card: Botão Palco em destaque + Menu Kebab no mobile */}
                      <div className="flex items-center gap-1 shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                        {/* Botão de abrir direto no Palco */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickPlay(song, e)}
                          title="Visualizar agora no palco"
                          className="p-2 rounded-xl text-blue-600 dark:text-sky-400 bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 transition-all active:scale-90"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* Ações Diretas no Desktop */}
                        <div className="hidden sm:flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(song, e)}
                            title="Editar cifra"
                            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(song.id, song.title, e)}
                            title="Excluir cifra"
                            className="p-2 rounded-xl text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Menu Kebab no Mobile */}
                        <div className="sm:hidden relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuSongId(isMenuOpen ? null : song.id)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Mais opções"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Popover do Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl bg-white dark:bg-neutral-850 shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  setOpenMenuSongId(null);
                                  handleOpenEdit(song, e);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  setOpenMenuSongId(null);
                                  handleDelete(song.id, song.title, e);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          )}
                        </div>
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
      {selectedSongIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pb-4 sm:pb-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#121212] dark:via-[#121212]/95 dark:to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto flex items-center gap-2">
            {activeTab === "library" && (
              <button
                type="button"
                onClick={() => setActiveTab("setlist")}
                className="py-3 sm:py-3.5 px-3 sm:px-4 rounded-2xl font-bold text-xs sm:text-sm bg-white dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all shrink-0"
                title="Ajustar ordem do culto"
              >
                <ArrowUpDown className="w-4 h-4 text-blue-500" />
                <span className="hidden xs:inline">Ordem</span>
              </button>
            )}

            <button
              type="button"
              onClick={startSetlist}
              className="flex-1 py-3 sm:py-3.5 px-4 sm:px-5 rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-blue-600/25 flex items-center justify-between transition-all active:scale-98 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="leading-tight font-extrabold text-sm sm:text-base truncate">
                    Iniciar Palco
                  </div>
                  <div className="text-[11px] font-normal opacity-90 truncate">
                    {selectedSongIds.length} {selectedSongIds.length === 1 ? "música" : "músicas na ordem"}
                  </div>
                </div>
              </div>

              <span className="text-[11px] sm:text-xs bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold shrink-0">
                Tocar →
              </span>
            </button>
          </div>
        </div>
      )}

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
