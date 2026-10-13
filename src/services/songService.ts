import { supabase } from "@/lib/supabase";
import { Song } from "@/types/song";

export interface SupabaseSongRow {
  id: string;
  title: string;
  artist: string;
  key?: string | null;
  chords: string; // Coluna oficial no Supabase: 'chords'
}

/**
 * Lê todas as músicas do Supabase utilizando a coluna 'chords'
 */
export async function fetchSongsFromSupabase(): Promise<Song[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, key, chords");

    if (error) {
      console.error("Erro ao ler músicas do Supabase:", error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: SupabaseSongRow) => ({
      id: String(row.id),
      title: row.title || "Sem título",
      artist: row.artist || "Desconhecido",
      key: row.key || undefined,
      chords: row.chords || "", // Garantindo a leitura da coluna 'chords'
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  } catch (err) {
    console.error("Exceção ao buscar músicas do Supabase:", err);
    return null;
  }
}

/**
 * Insere uma nova música no Supabase utilizando a coluna 'chords'
 */
export async function insertSongToSupabase(song: Song): Promise<boolean> {
  if (!supabase) return false;

  try {
    const payload: SupabaseSongRow = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      key: song.key || null,
      chords: song.chords, // Garantindo a inserção na coluna 'chords'
    };

    const { error } = await supabase.from("songs").insert([payload]);

    if (error) {
      console.error("Erro ao inserir música no Supabase:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exceção ao inserir música no Supabase:", err);
    return false;
  }
}

/**
 * Atualiza uma música no Supabase utilizando a coluna 'chords'
 */
export async function updateSongInSupabase(
  id: string,
  updatedData: Partial<Omit<Song, "id">>
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const payload: Partial<SupabaseSongRow> = {};
    if (updatedData.title !== undefined) payload.title = updatedData.title;
    if (updatedData.artist !== undefined) payload.artist = updatedData.artist;
    if (updatedData.key !== undefined) payload.key = updatedData.key || null;
    if (updatedData.chords !== undefined) payload.chords = updatedData.chords; // Garantindo atualização da coluna 'chords'

    const { error } = await supabase.from("songs").update(payload).eq("id", id);

    if (error) {
      console.error("Erro ao atualizar música no Supabase:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exceção ao atualizar música no Supabase:", err);
    return false;
  }
}

/**
 * Exclui uma música no Supabase
 */
export async function deleteSongFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("songs").delete().eq("id", id);

    if (error) {
      console.error("Erro ao deletar música no Supabase:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exceção ao deletar música no Supabase:", err);
    return false;
  }
}

