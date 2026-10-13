export interface Song {
  id: string;
  title: string;
  artist: string;
  key?: string; // Tom (ex: C, G, Em)
  chords: string; // Texto formatado da cifra
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = "manager" | "viewer";
export type ThemeMode = "light" | "dark";

