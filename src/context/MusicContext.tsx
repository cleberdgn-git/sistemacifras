"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Song, ViewMode, ThemeMode } from "@/types/song";
import { initialSongs } from "@/data/initialSongs";
import {
  fetchSongsFromSupabase,
  insertSongToSupabase,
  updateSongInSupabase,
  deleteSongFromSupabase,
} from "@/services/songService";
import { isSupabaseConfigured } from "@/lib/supabase";

interface MusicContextType {
  songs: Song[];
  selectedSongIds: string[];
  currentSongIndex: number;
  viewMode: ViewMode;
  theme: ThemeMode;
  fontSize: number;
  isFullscreen: boolean;
  selectedSongsList: Song[];
  currentSong: Song | null;
  isCloudConnected: boolean;
  isSyncing: boolean;

  // Ações de Músicas
  addSong: (song: Omit<Song, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateSong: (id: string, song: Partial<Omit<Song, "id">>) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  syncAllToSupabase: () => Promise<void>;
  refreshFromSupabase: () => Promise<void>;

  // Ações de Setlist e Reordenação
  toggleSelectSong: (id: string) => void;
  selectAllSongs: () => void;
  clearSelection: () => void;
  startSetlist: () => void;
  exitViewer: () => void;
  nextSong: () => void;
  prevSong: () => void;
  goToSong: (index: number) => void;
  moveSongUp: (id: string) => void;
  moveSongDown: (id: string) => void;
  moveToPosition: (id: string, targetIndex: number) => void;
  reorderSetlist: (newOrder: string[]) => void;

  // Ações Visuais e Palco
  toggleTheme: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleFullscreen: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const LOCAL_STORAGE_SONGS_KEY = "louvor_cifras_songs_v1";
const LOCAL_STORAGE_SETLIST_KEY = "louvor_cifras_setlist_ids_v1";
const LOCAL_STORAGE_THEME_KEY = "louvor_cifras_theme";
const LOCAL_STORAGE_FONT_KEY = "louvor_cifras_fontsize";

export function MusicProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("manager");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [fontSize, setFontSize] = useState<number>(17);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Inicialização e Carregamento (LocalStorage + Supabase)
  useEffect(() => {
    setIsMounted(true);
    setIsCloudConnected(isSupabaseConfigured());

    let loadedSongs: Song[] = initialSongs;

    // 1. Carregamento Imediato do LocalStorage (Sem atrasos de tela)
    try {
      const savedSongs = localStorage.getItem(LOCAL_STORAGE_SONGS_KEY);
      if (savedSongs) {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedSongs = parsed;
          setSongs(parsed);
        } else {
          setSongs(initialSongs);
          localStorage.setItem(LOCAL_STORAGE_SONGS_KEY, JSON.stringify(initialSongs));
        }
      } else {
        setSongs(initialSongs);
        localStorage.setItem(LOCAL_STORAGE_SONGS_KEY, JSON.stringify(initialSongs));
      }
    } catch (e) {
      console.error("Erro ao carregar músicas do localStorage:", e);
      setSongs(initialSongs);
    }

    // 2. Carregar Setlist salvo
    try {
      const savedSetlist = localStorage.getItem(LOCAL_STORAGE_SETLIST_KEY);
      if (savedSetlist) {
        const parsedIds = JSON.parse(savedSetlist);
        if (Array.isArray(parsedIds)) {
          const validIds = parsedIds.filter((id) => loadedSongs.some((s) => s.id === id));
          setSelectedSongIds(validIds);
        } else {
          setSelectedSongIds(loadedSongs.slice(0, 3).map((s) => s.id));
        }
      } else {
        setSelectedSongIds(loadedSongs.slice(0, 3).map((s) => s.id));
      }
    } catch {
      setSelectedSongIds(loadedSongs.slice(0, 3).map((s) => s.id));
    }

    // 3. Sincronização em Segundo Plano com o Supabase (usando a coluna 'chords')
    if (isSupabaseConfigured()) {
      setIsSyncing(true);
      fetchSongsFromSupabase()
        .then(async (cloudSongs) => {
          if (cloudSongs && cloudSongs.length > 0) {
            setSongs(cloudSongs);
            localStorage.setItem(LOCAL_STORAGE_SONGS_KEY, JSON.stringify(cloudSongs));
          } else if (cloudSongs && cloudSongs.length === 0 && loadedSongs.length > 0) {
            // Tabela do Supabase vazia: enviar as músicas locais para lá
            for (const s of loadedSongs) {
              await insertSongToSupabase(s);
            }
          }
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }

    // Carregar Tema
    try {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as ThemeMode;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else {
        setTheme("dark");
      }
    } catch {
      setTheme("dark");
    }

    // Carregar Tamanho de Fonte
    try {
      const savedFont = localStorage.getItem(LOCAL_STORAGE_FONT_KEY);
      if (savedFont) {
        const parsedFont = parseInt(savedFont, 10);
        if (!isNaN(parsedFont) && parsedFont >= 12 && parsedFont <= 34) {
          setFontSize(parsedFont);
        }
      }
    } catch {
      setFontSize(17);
    }

    // Listener de Fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Sincronizar tema no HTML
  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme, isMounted]);

  // Salvar Músicas no LocalStorage
  useEffect(() => {
    if (!isMounted || songs.length === 0) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_SONGS_KEY, JSON.stringify(songs));
    } catch (e) {
      console.error("Erro ao salvar músicas no localStorage:", e);
    }
  }, [songs, isMounted]);

  // Salvar Setlist ordenado no LocalStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_SETLIST_KEY, JSON.stringify(selectedSongIds));
    } catch (e) {
      console.error("Erro ao salvar setlist no localStorage:", e);
    }
  }, [selectedSongIds, isMounted]);

  // Salvar Tamanho de Fonte
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LOCAL_STORAGE_FONT_KEY, fontSize.toString());
  }, [fontSize, isMounted]);

  // Músicas no setlist na ordem exata de selectedSongIds
  const selectedSongsList = selectedSongIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  const currentSong =
    selectedSongsList.length > 0 && currentSongIndex < selectedSongsList.length
      ? selectedSongsList[currentSongIndex]
      : null;

  // Ações de músicas conectadas ao Supabase com a coluna 'chords'
  const addSong = useCallback(
    async (newSongData: Omit<Song, "id" | "createdAt" | "updatedAt">) => {
      const newSong: Song = {
        ...newSongData,
        id: "song_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setSongs((prev) => [newSong, ...prev]);
      setSelectedSongIds((prev) => [...prev, newSong.id]);

      // Inserção no Supabase utilizando a coluna 'chords'
      if (isSupabaseConfigured()) {
        setIsSyncing(true);
        await insertSongToSupabase(newSong);
        setIsSyncing(false);
      }
    },
    []
  );

  const updateSong = useCallback(
    async (id: string, updatedData: Partial<Omit<Song, "id">>) => {
      setSongs((prev) =>
        prev.map((song) =>
          song.id === id
            ? { ...song, ...updatedData, updatedAt: Date.now() }
            : song
        )
      );

      // Atualização no Supabase utilizando a coluna 'chords'
      if (isSupabaseConfigured()) {
        setIsSyncing(true);
        await updateSongInSupabase(id, updatedData);
        setIsSyncing(false);
      }
    },
    []
  );

  const deleteSong = useCallback(async (id: string) => {
    setSongs((prev) => prev.filter((song) => song.id !== id));
    setSelectedSongIds((prev) => prev.filter((songId) => songId !== id));

    // Exclusão no Supabase
    if (isSupabaseConfigured()) {
      setIsSyncing(true);
      await deleteSongFromSupabase(id);
      setIsSyncing(false);
    }
  }, []);

  // Enviar todas as músicas locais para o Supabase
  const syncAllToSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || songs.length === 0) return;
    setIsSyncing(true);
    for (const song of songs) {
      await insertSongToSupabase(song);
    }
    setIsSyncing(false);
  }, [songs]);

  // Recarregar dados mais recentes do Supabase
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setIsSyncing(true);
    const cloudSongs = await fetchSongsFromSupabase();
    if (cloudSongs && cloudSongs.length > 0) {
      setSongs(cloudSongs);
      localStorage.setItem(LOCAL_STORAGE_SONGS_KEY, JSON.stringify(cloudSongs));
    }
    setIsSyncing(false);
  }, []);

  // Ações de setlist e ordenação
  const toggleSelectSong = useCallback((id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAllSongs = useCallback(() => {
    setSelectedSongIds(songs.map((s) => s.id));
  }, [songs]);

  const clearSelection = useCallback(() => {
    setSelectedSongIds([]);
  }, []);

  const moveSongUp = useCallback((id: string) => {
    setSelectedSongIds((prev) => {
      const index = prev.indexOf(id);
      if (index <= 0) return prev;
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  }, []);

  const moveSongDown = useCallback((id: string) => {
    setSelectedSongIds((prev) => {
      const index = prev.indexOf(id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  }, []);

  const moveToPosition = useCallback((id: string, targetIndex: number) => {
    setSelectedSongIds((prev) => {
      const currentIndex = prev.indexOf(id);
      if (currentIndex === -1) return prev;
      const updated = [...prev];
      const [movedItem] = updated.splice(currentIndex, 1);
      const boundedIndex = Math.max(0, Math.min(targetIndex, updated.length));
      updated.splice(boundedIndex, 0, movedItem);
      return updated;
    });
  }, []);

  const reorderSetlist = useCallback((newOrder: string[]) => {
    setSelectedSongIds(newOrder);
  }, []);

  const startSetlist = useCallback(() => {
    if (selectedSongIds.length === 0) return;
    setCurrentSongIndex(0);
    setViewMode("viewer");
  }, [selectedSongIds]);

  const exitViewer = useCallback(() => {
    setViewMode("manager");
  }, []);

  const nextSong = useCallback(() => {
    setCurrentSongIndex((prev) => {
      if (prev < selectedSongsList.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [selectedSongsList.length]);

  const prevSong = useCallback(() => {
    setCurrentSongIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const goToSong = useCallback(
    (index: number) => {
      if (index >= 0 && index < selectedSongsList.length) {
        setCurrentSongIndex(index);
      }
    },
    [selectedSongsList.length]
  );

  // Ações visuais
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 2, 34));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 2, 12));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(17);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen não suportado ou bloqueado pelo navegador:", err);
    }
  }, []);

  return (
    <MusicContext.Provider
      value={{
        songs,
        selectedSongIds,
        currentSongIndex,
        viewMode,
        theme,
        fontSize,
        isFullscreen,
        selectedSongsList,
        currentSong,
        isCloudConnected,
        isSyncing,
        addSong,
        updateSong,
        deleteSong,
        syncAllToSupabase,
        refreshFromSupabase,
        toggleSelectSong,
        selectAllSongs,
        clearSelection,
        startSetlist,
        exitViewer,
        nextSong,
        prevSong,
        goToSong,
        moveSongUp,
        moveSongDown,
        moveToPosition,
        reorderSetlist,
        toggleTheme,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        toggleFullscreen,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic deve ser usado dentro de um MusicProvider");
  }
  return context;
}
