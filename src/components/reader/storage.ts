/**
 * =============================================================
 *  Fichier    : storage.ts (reader)
 *  Projet     : Kalami
 *  Description: Stockage local de la liseuse : réglages de lecture (par appareil) et
 *               position de lecture (visiteurs, et secours hors ligne des lecteurs
 *               connectés). Toute valeur lue est revalidée ; le stockage peut être
 *               indisponible (navigation privée) sans bloquer la lecture.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/reader/types.ts, lib/reader/position.ts
 * =============================================================
 */

import { parsePosition } from "@/lib/reader/position";
import {
  FONT_SIZES,
  LINE_HEIGHTS,
  READER_FONTS,
  READER_MODES,
  READER_THEMES,
  type ReaderSettings,
  type SavedPosition,
} from "@/lib/reader/types";

const SETTINGS_KEY = "kalami:liseuse:reglages";
const POSITION_PREFIX = "kalami:liseuse:position:";

/** Largeur sous laquelle le défilement est le mode par défaut (téléphone). */
const PHONE_MAX_WIDTH = 640;

// ==================== ACCÈS SÛR ====================

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage plein ou interdit : la lecture continue sans mémorisation locale
  }
}

/** Valeur d'une liste autorisée, sinon la valeur par défaut. */
function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

/** Indice entier valide dans une liste, sinon la valeur par défaut. */
function indexIn(list: readonly unknown[], value: unknown, fallback: number): number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < list.length
    ? (value as number)
    : fallback;
}

// ==================== RÉGLAGES ====================

/** Réglages par défaut : pages à tourner sur ordinateur et tablette, défilement sur mobile. */
export function defaultSettings(): ReaderSettings {
  const phone = window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`).matches;
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    mode: phone ? "scroll" : "flip",
    theme: dark ? "dark" : "light",
    font: "serif",
    fontSize: 2,
    lineHeight: 1,
  };
}

/** Réglages enregistrés sur l'appareil, complétés par les valeurs par défaut. */
export function loadSettings(): ReaderSettings {
  const defaults = defaultSettings();
  const saved = (readJson(SETTINGS_KEY) ?? {}) as Partial<Record<keyof ReaderSettings, unknown>>;
  return {
    mode: oneOf(READER_MODES, saved.mode, defaults.mode),
    theme: oneOf(READER_THEMES, saved.theme, defaults.theme),
    font: oneOf(READER_FONTS, saved.font, defaults.font),
    fontSize: indexIn(FONT_SIZES, saved.fontSize, defaults.fontSize),
    lineHeight: indexIn(LINE_HEIGHTS, saved.lineHeight, defaults.lineHeight),
  };
}

export function saveSettings(settings: ReaderSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

// ==================== POSITION ====================

/** Position enregistrée sur l'appareil pour un livre, ou null. */
export function loadLocalPosition(bookId: string): SavedPosition | null {
  const saved = readJson(POSITION_PREFIX + bookId) as Record<string, unknown> | null;
  const position = parsePosition(saved);
  if (!saved || !position) return null;
  const progress = typeof saved.progress === "number" ? saved.progress : 0;
  const updatedAt = typeof saved.updatedAt === "string" ? saved.updatedAt : "";
  if (Number.isNaN(Date.parse(updatedAt))) return null;
  return { ...position, progress: Math.min(1, Math.max(0, progress)), updatedAt };
}

export function saveLocalPosition(bookId: string, position: SavedPosition): void {
  writeJson(POSITION_PREFIX + bookId, position);
}
