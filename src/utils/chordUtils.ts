/**
 * Utilitários para formatação, detecção e anotações coloridas em cifras de louvor
 */

const CHORD_TOKEN_REGEX = /^[A-G](#|b)?(m|M|maj|dim|aug|sus[24]?|[0-9]+)*(\/[A-G](#|b)?)?$/;

export type AnnotationColor = "yellow" | "green" | "red" | "blue" | "purple" | "orange" | "pink";

export interface AnnotationTag {
  color: AnnotationColor;
  text: string;
}

// Verifica se a linha é um comentário / observação de linha inteira
export function getLineAnnotationType(line: string): { isAnnotation: boolean; color: AnnotationColor; label?: string; text: string } | null {
  const trimmed = line.trim();

  // Comentários de barra dupla: // anotação
  if (trimmed.startsWith("//")) {
    return {
      isAnnotation: true,
      color: "green",
      label: "OBS",
      text: trimmed.replace(/^\/\/\s*/, ""),
    };
  }

  // Comentários com prefixo ATENÇÃO / CUIDADO / PARADA
  if (/^(atenção|cuidado|parada|alerta):/i.test(trimmed)) {
    const colonIndex = trimmed.indexOf(":");
    return {
      isAnnotation: true,
      color: "red",
      label: trimmed.substring(0, colonIndex).toUpperCase(),
      text: trimmed.substring(colonIndex + 1).trim(),
    };
  }

  // Comentários com prefixo DINÂMICA / ARRANJO / ENTRADA
  if (/^(dinâmica|arranjo|convenção|entrada|solo):/i.test(trimmed)) {
    const colonIndex = trimmed.indexOf(":");
    return {
      isAnnotation: true,
      color: "purple",
      label: trimmed.substring(0, colonIndex).toUpperCase(),
      text: trimmed.substring(colonIndex + 1).trim(),
    };
  }

  // Comentários com prefixo OBS / NOTA / DICA
  if (/^(obs|nota|dica|observação):/i.test(trimmed)) {
    const colonIndex = trimmed.indexOf(":");
    return {
      isAnnotation: true,
      color: "yellow",
      label: trimmed.substring(0, colonIndex).toUpperCase(),
      text: trimmed.substring(colonIndex + 1).trim(),
    };
  }

  return null;
}

// Verifica se é cabeçalho de seção estrutural da música
export function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (getLineAnnotationType(trimmed)) return false;

  return (
    (trimmed.startsWith("[") && trimmed.endsWith("]") && !trimmed.toLowerCase().includes("obs:")) ||
    (trimmed.startsWith("(") && trimmed.endsWith(")")) ||
    /^(intro|refrão|primeira parte|segunda parte|ponte|verso|coro|final|solo|interlúdio):?$/i.test(
      trimmed
    )
  );
}

// Verifica se a linha consiste primariamente em acordes musicais
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || isSectionHeader(trimmed) || getLineAnnotationType(trimmed)) return false;

  // Remover marcações em tags para não poluir o cálculo
  const cleanLine = trimmed.replace(/\{[a-z]+:[^}]+\}/gi, "");
  const tokens = cleanLine.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    const cleanToken = token.replace(/[.,:;()|]/g, "");
    if (CHORD_TOKEN_REGEX.test(cleanToken)) {
      chordCount++;
    }
  }

  return chordCount / tokens.length >= 0.6;
}

// Escalas cromáticas para transposição
const CHROMATIC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHROMATIC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  if (chord.includes("/")) {
    const [root, bass] = chord.split("/");
    return `${transposeChord(root, semitones)}/${transposeChord(bass, semitones)}`;
  }

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, rootNote, suffix] = match;
  let index = CHROMATIC_SHARP.indexOf(rootNote);
  if (index === -1) {
    index = CHROMATIC_FLAT.indexOf(rootNote);
  }
  if (index === -1) return chord;

  const newIndex = (index + semitones + 12 * 10) % 12;
  const newRoot = CHROMATIC_SHARP[newIndex];
  return `${newRoot}${suffix}`;
}

export function transposeChordsText(text: string, semitones: number): string {
  if (semitones === 0) return text;

  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    if (!isChordLine(line)) return line;

    let newLine = "";
    let i = 0;
    while (i < line.length) {
      if (line[i] === " ") {
        newLine += " ";
        i++;
      } else {
        let chordStr = "";
        while (i < line.length && line[i] !== " ") {
          chordStr += line[i];
          i++;
        }
        const transposed = transposeChord(chordStr, semitones);
        newLine += transposed;
      }
    }
    return newLine;
  });

  return processedLines.join("\n");
}

// Mapa de cores para Tailwind CSS classes
export const ANNOTATION_STYLES: Record<
  AnnotationColor,
  { bg: string; text: string; border: string; badge: string }
> = {
  yellow: {
    bg: "bg-amber-500/10 dark:bg-amber-400/15",
    text: "text-amber-700 dark:text-amber-300 font-semibold",
    border: "border-amber-500/30",
    badge: "bg-amber-500 text-white dark:bg-amber-400 dark:text-neutral-900",
  },
  green: {
    bg: "bg-emerald-500/10 dark:bg-emerald-400/15",
    text: "text-emerald-700 dark:text-emerald-300 font-semibold",
    border: "border-emerald-500/30",
    badge: "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-neutral-900",
  },
  red: {
    bg: "bg-rose-500/10 dark:bg-rose-400/15",
    text: "text-rose-700 dark:text-rose-300 font-bold",
    border: "border-rose-500/30",
    badge: "bg-rose-600 text-white dark:bg-rose-500 dark:text-white",
  },
  blue: {
    bg: "bg-sky-500/10 dark:bg-sky-400/15",
    text: "text-sky-700 dark:text-sky-300 font-semibold",
    border: "border-sky-500/30",
    badge: "bg-sky-600 text-white dark:bg-sky-400 dark:text-neutral-900",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-400/15",
    text: "text-purple-700 dark:text-purple-300 font-semibold",
    border: "border-purple-500/30",
    badge: "bg-purple-600 text-white dark:bg-purple-400 dark:text-white",
  },
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-400/15",
    text: "text-orange-700 dark:text-orange-300 font-semibold",
    border: "border-orange-500/30",
    badge: "bg-orange-600 text-white dark:bg-orange-400 dark:text-neutral-900",
  },
  pink: {
    bg: "bg-pink-500/10 dark:bg-pink-400/15",
    text: "text-pink-700 dark:text-pink-300 font-semibold",
    border: "border-pink-500/30",
    badge: "bg-pink-600 text-white dark:bg-pink-400 dark:text-white",
  },
};

// Parser para detectar tags inline como {vermelho: Parada} ou {amarelo: Entra bateria}
export interface ParsedSpan {
  text: string;
  isAnnotation: boolean;
  color?: AnnotationColor;
}

export function parseInlineAnnotations(line: string): ParsedSpan[] {
  const regex = /\{(amarelo|verde|vermelho|azul|roxo|laranja|rosa|yellow|green|red|blue|purple|orange|pink|obs):([^}]+)\}/gi;
  const spans: ParsedSpan[] = [];
  let lastIndex = 0;
  let match;

  const colorMap: Record<string, AnnotationColor> = {
    amarelo: "yellow",
    yellow: "yellow",
    obs: "yellow",
    verde: "green",
    green: "green",
    vermelho: "red",
    red: "red",
    azul: "blue",
    blue: "blue",
    roxo: "purple",
    purple: "purple",
    laranja: "orange",
    orange: "orange",
    rosa: "pink",
    pink: "pink",
  };

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      spans.push({
        text: line.substring(lastIndex, match.index),
        isAnnotation: false,
      });
    }

    const colorKey = match[1].toLowerCase();
    const color = colorMap[colorKey] || "yellow";
    const text = match[2];

    spans.push({
      text,
      isAnnotation: true,
      color,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    spans.push({
      text: line.substring(lastIndex),
      isAnnotation: false,
    });
  }

  return spans.length > 0 ? spans : [{ text: line, isAnnotation: false }];
}
