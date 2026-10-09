/**
 * =============================================================
 *  Fichier    : annotations.ts
 *  Projet     : Kalami
 *  Description: Logique pure des annotations : validation d'un ancrage, d'une couleur, du
 *               passage et de la note ; découpe d'un surlignage par bloc puis par morceau
 *               de page (le surlignage suit le texte quelle que soit la pagination) ; tri,
 *               filtre et regroupement par chapitre pour le panneau « Annotations ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-10
 *  Dépendances: types.ts, position.ts
 * =============================================================
 */

import { parsePosition } from "./position";
import {
  HIGHLIGHT_COLORS,
  type Highlight,
  type HighlightAnchor,
  type HighlightColor,
  type TextPoint,
} from "./types";

/** Longueur maximale du passage conservé et de la note (mêmes règles que la base). */
export const MAX_QUOTE_LENGTH = 1000;
export const MAX_NOTE_LENGTH = 2000;
/** Longueur maximale d'un extrait partagé (carte image). */
export const SHARE_MAX_LENGTH = 280;

/** Morceau surligné d'un bloc : texte du caractère « start » à « end » exclu. */
export type Segment = {
  id: string;
  color: HighlightColor;
  hasNote: boolean;
  start: number;
  end: number;
};

// ==================== VALIDATION ====================

/** Compare deux points du texte (négatif si a est avant b). */
export function comparePoints(a: TextPoint, b: TextPoint): number {
  return a.block - b.block || a.offset - b.offset;
}

/**
 * Valide un ancrage reçu du navigateur sans faire confiance à sa forme.
 * @returns Ancrage borné (fin strictement après le début), ou null
 */
export function parseAnchor(value: unknown): HighlightAnchor | null {
  if (typeof value !== "object" || value === null) return null;
  const { chapter, start, end } = value as Record<string, unknown>;
  const point = (raw: unknown) =>
    typeof raw === "object" && raw !== null ? parsePosition({ chapter, ...raw }) : null;
  const from = point(start);
  const to = point(end);
  if (!from || !to) return null;
  const anchor = {
    chapter: from.chapter,
    start: { block: from.block, offset: from.offset },
    end: { block: to.block, offset: to.offset },
  };
  return comparePoints(anchor.start, anchor.end) < 0 ? anchor : null;
}

/** Vrai si la valeur est une couleur de surlignage connue. */
export function isHighlightColor(value: unknown): value is HighlightColor {
  return HIGHLIGHT_COLORS.includes(value as HighlightColor);
}

/**
 * Nettoie le passage sélectionné : espaces regroupés, longueur limitée.
 * @returns Passage (≤ 1000 caractères), ou null s'il est vide
 */
export function cleanQuote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > MAX_QUOTE_LENGTH ? `${text.slice(0, MAX_QUOTE_LENGTH - 1)}…` : text;
}

/**
 * Valide une note : vide = aucune note.
 * @returns { valid, note } ; valid est faux si la note dépasse 2000 caractères
 */
export function cleanNote(value: unknown): { valid: boolean; note: string | null } {
  if (value === null || value === undefined) return { valid: true, note: null };
  if (typeof value !== "string") return { valid: false, note: null };
  const note = value.trim();
  if (note.length > MAX_NOTE_LENGTH) return { valid: false, note: null };
  return { valid: true, note: note || null };
}

// ==================== DÉCOUPE ====================

/**
 * Morceaux surlignés d'un bloc, sans chevauchement : là où deux surlignages se recouvrent,
 * le plus récent (dernier de la liste) l'emporte.
 * @param highlights - Surlignages du chapitre, du plus ancien au plus récent
 * @param block      - Indice du bloc
 * @param length     - Longueur du texte du bloc
 * @returns Morceaux triés, bornés à [0, length]
 *
 * Exemple : un surlignage du bloc 1 (décalage 4) au bloc 3 (décalage 2) couvre tout le
 *           bloc 2 et donne { start: 0, end: 2 } pour le bloc 3.
 */
export function blockSegments(highlights: Highlight[], block: number, length: number): Segment[] {
  const covering = highlights.flatMap((highlight) => {
    if (block < highlight.start.block || block > highlight.end.block) return [];
    const start = highlight.start.block === block ? highlight.start.offset : 0;
    const end = highlight.end.block === block ? highlight.end.offset : length;
    const segment = {
      id: highlight.id,
      color: highlight.color,
      hasNote: Boolean(highlight.note),
      start: Math.max(0, Math.min(start, length)),
      end: Math.max(0, Math.min(end, length)),
    };
    return segment.end > segment.start ? [segment] : [];
  });
  if (covering.length < 2) return covering;

  // Coupures à chaque bord, puis pour chaque intervalle le surlignage le plus récent
  const edges = [...new Set(covering.flatMap((s) => [s.start, s.end]))].sort((a, b) => a - b);
  const pieces: Segment[] = [];
  for (let index = 0; index < edges.length - 1; index++) {
    const [start, end] = [edges[index], edges[index + 1]];
    const top = covering.findLast((s) => s.start <= start && s.end >= end);
    if (!top) continue;
    const previous = pieces.at(-1);
    if (previous && previous.id === top.id && previous.end === start) previous.end = end;
    else pieces.push({ ...top, start, end });
  }
  return pieces;
}

/**
 * Morceaux visibles dans une partie de bloc affichée (fragment de page), décalés pour
 * partir du début de cette partie.
 * @param segments - Morceaux du bloc entier
 * @param start    - Premier caractère du fragment
 * @param end      - Fin du fragment (exclue)
 */
export function fragmentSegments(segments: Segment[], start: number, end: number): Segment[] {
  return segments.flatMap((segment) => {
    const from = Math.max(segment.start, start);
    const to = Math.min(segment.end, end);
    return to > from ? [{ ...segment, start: from - start, end: to - start }] : [];
  });
}

// ==================== PANNEAU ====================

/** Annotations dans l'ordre du livre. */
export function sortHighlights(highlights: Highlight[]): Highlight[] {
  return [...highlights].sort(
    (a, b) => a.chapter - b.chapter || comparePoints(a.start, b.start),
  );
}

/** Texte sans accents ni majuscules, pour la recherche. */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Filtre les annotations par texte (passage ou note) et par couleur.
 * @param query - Texte cherché (accents et majuscules ignorés), vide = tout
 * @param color - Couleur, ou null pour toutes
 */
export function filterHighlights(
  highlights: Highlight[],
  query: string,
  color: HighlightColor | null,
): Highlight[] {
  const wanted = fold(query.trim());
  return highlights.filter(
    (item) =>
      (!color || item.color === color) &&
      (!wanted || fold(`${item.quote} ${item.note ?? ""}`).includes(wanted)),
  );
}

/**
 * Regroupe les annotations par chapitre, dans l'ordre du livre.
 * @returns Groupes { chapter, items }
 */
export function groupByChapter(
  highlights: Highlight[],
): { chapter: number; items: Highlight[] }[] {
  const groups: { chapter: number; items: Highlight[] }[] = [];
  for (const item of sortHighlights(highlights)) {
    const last = groups.at(-1);
    if (last?.chapter === item.chapter) last.items.push(item);
    else groups.push({ chapter: item.chapter, items: [item] });
  }
  return groups;
}

// ==================== PARTAGE ====================

/**
 * Extrait partageable : au plus 280 caractères, coupé à la fin d'un mot.
 * @returns Extrait, terminé par « … » s'il a été raccourci
 */
export function shareExcerpt(quote: string, max = SHARE_MAX_LENGTH): string {
  const text = quote.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
