/**
 * =============================================================
 *  Fichier    : position.ts
 *  Projet     : Kalami
 *  Description: Calculs de position de la liseuse (fonctions pures) : avancement dans le
 *               chapitre et dans le livre, chapitres lisibles, choix de la position de
 *               départ entre l'URL, le serveur (autres appareils) et l'appareil.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: types.ts
 * =============================================================
 */

import type { TocEntry } from "@/lib/catalog/types";

import type { ReaderAccess, ReaderPosition, SavedPosition } from "./types";

export const START_POSITION: ReaderPosition = { chapter: 1, block: 0, offset: 0 };

// ==================== AVANCEMENT ====================

/**
 * Part du chapitre déjà lue, d'après la longueur des blocs.
 * @param blockLengths - Longueur du texte de chaque bloc
 * @param block        - Bloc courant
 * @param offset       - Décalage dans le bloc courant
 * @returns Valeur entre 0 et 1
 */
export function chapterFraction(blockLengths: number[], block: number, offset: number): number {
  const total = blockLengths.reduce((sum, length) => sum + length, 0);
  if (total === 0) return 0;
  const before = blockLengths.slice(0, block).reduce((sum, length) => sum + length, 0);
  const inside = Math.min(offset, blockLengths[block] ?? 0);
  return Math.min(1, (before + inside) / total);
}

/**
 * Avancement dans le livre, pondéré par le nombre de mots de chaque chapitre.
 * @param toc      - Sommaire (nombre de mots par chapitre)
 * @param chapter  - Chapitre courant
 * @param fraction - Part lue du chapitre courant (0 à 1)
 * @returns Valeur entre 0 et 1 (arrondie à 4 décimales, comme en base)
 */
export function bookProgress(toc: TocEntry[], chapter: number, fraction: number): number {
  const total = toc.reduce((sum, entry) => sum + entry.word_count, 0);
  let value: number;
  if (total === 0) {
    value = toc.length ? (chapter - 1 + fraction) / toc.length : 0;
  } else {
    const before = toc
      .filter((entry) => entry.chapter_position < chapter)
      .reduce((sum, entry) => sum + entry.word_count, 0);
    const current = toc.find((entry) => entry.chapter_position === chapter)?.word_count ?? 0;
    value = (before + fraction * current) / total;
  }
  return Math.round(Math.min(1, Math.max(0, value)) * 10000) / 10000;
}

// ==================== ACCÈS ====================

/**
 * Indique si un chapitre peut être demandé à l'API (sinon : écran de verrouillage).
 * Simple confort d'affichage : la vraie vérification reste celle du serveur (403).
 */
export function isChapterReadable(toc: TocEntry[], chapter: number, access: ReaderAccess): boolean {
  const entry = toc.find((item) => item.chapter_position === chapter);
  if (!entry) return false;
  return access === "full" || entry.is_preview;
}

/** Chapitre suivant du sommaire, ou null à la fin du livre. */
export function nextChapter(toc: TocEntry[], chapter: number): number | null {
  const next = toc.find((entry) => entry.chapter_position > chapter);
  return next?.chapter_position ?? null;
}

/** Chapitre précédent du sommaire, ou null au début du livre. */
export function previousChapter(toc: TocEntry[], chapter: number): number | null {
  const previous = toc.filter((entry) => entry.chapter_position < chapter).pop();
  return previous?.chapter_position ?? null;
}

// ==================== POSITION DE DÉPART ====================

/**
 * Choisit la position d'ouverture de la liseuse.
 *
 * Ordre : chapitre demandé dans l'URL → position la plus récente entre le serveur
 * (synchronisée entre appareils) et l'appareil → début du livre. Une position hors du
 * sommaire (nouvelle version du livre plus courte) ramène au début.
 *
 * @param toc       - Sommaire du livre
 * @param requested - Chapitre demandé dans l'URL, ou null
 * @param server    - Position enregistrée sur le serveur, ou null
 * @param local     - Position enregistrée sur l'appareil, ou null
 * @returns Position de départ
 */
export function resolveStartPosition(
  toc: TocEntry[],
  requested: number | null,
  server: SavedPosition | null,
  local: SavedPosition | null,
): ReaderPosition {
  const exists = (chapter: number) => toc.some((entry) => entry.chapter_position === chapter);

  if (requested !== null && exists(requested)) return { chapter: requested, block: 0, offset: 0 };

  const candidates = [server, local].filter(
    (saved): saved is SavedPosition => saved !== null && exists(saved.chapter),
  );
  candidates.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const latest = candidates[0];
  if (latest) return { chapter: latest.chapter, block: latest.block, offset: latest.offset };

  return toc.length ? { ...START_POSITION, chapter: toc[0].chapter_position } : START_POSITION;
}

/**
 * Valide une position reçue (stockage local ou requête) sans faire confiance à sa forme.
 * @returns Position bornée, ou null si la valeur est invalide
 */
export function parsePosition(value: unknown): ReaderPosition | null {
  if (typeof value !== "object" || value === null) return null;
  const { chapter, block, offset } = value as Record<string, unknown>;
  const isInt = (n: unknown, min: number, max: number): n is number =>
    typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
  if (!isInt(chapter, 1, 1000) || !isInt(block, 0, 100000) || !isInt(offset, 0, 10000000)) {
    return null;
  }
  return { chapter, block, offset };
}
