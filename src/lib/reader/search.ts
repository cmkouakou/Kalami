/**
 * =============================================================
 *  Fichier    : search.ts
 *  Projet     : Kalami
 *  Description: Recherche dans le texte d'un livre (fonctions pures). Insensible à la casse
 *               et aux accents. Les décalages renvoyés portent sur le texte du bloc tel que
 *               le navigateur le lit (textContent), pour placer la liseuse au bon endroit.
 *               L'appelant ne fournit QUE les chapitres autorisés (coupure de l'extrait
 *               déjà appliquée) : rien d'autre ne peut apparaître dans les résultats.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: htmlparser2, domutils
 * =============================================================
 */

import { textContent } from "domutils";
import { parseDocument } from "htmlparser2";

import type { SearchHit } from "./types";

// ==================== CONSTANTES ====================

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_MAX_HITS = 50;

/** Nombre de caractères gardés de chaque côté de l'occurrence. */
const SNIPPET_CONTEXT = 60;

/** Chapitre fourni à la recherche (blocs HTML nettoyés). */
export type SearchableChapter = {
  position: number;
  title: string;
  blocks: string[];
};

// ==================== NORMALISATION ====================

/**
 * Valide et nettoie la requête de recherche.
 * @returns Requête (espaces réduits), ou null si trop courte ou trop longue
 */
export function parseSearchQuery(value: string | null): string | null {
  const query = (value ?? "").replace(/\s+/g, " ").trim();
  if (query.length < SEARCH_MIN_LENGTH || query.length > SEARCH_MAX_LENGTH) return null;
  return query;
}

/**
 * Texte normalisé (minuscules, sans accents) et correspondance vers le texte d'origine.
 * Chaque caractère est traité seul : la correspondance reste exacte même si la
 * normalisation change la longueur (lettres décomposées, minuscules à deux caractères).
 */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  for (let index = 0; index < text.length; index++) {
    const folded = text[index].normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (const char of folded) {
      normalized += char;
      map.push(index);
    }
  }
  return { normalized, map };
}

/** Texte brut d'un bloc HTML, identique au textContent du navigateur. */
export function blockText(html: string): string {
  return textContent(parseDocument(html).children);
}

// ==================== RECHERCHE ====================

/**
 * Cherche une requête dans les chapitres fournis.
 * @param chapters - Chapitres autorisés, dans l'ordre du livre
 * @param query    - Requête déjà validée (parseSearchQuery)
 * @param maxHits  - Nombre maximal de résultats
 * @returns Occurrences avec position (chapitre, bloc, décalage) et extrait de contexte
 *
 * Exemple : searchChapters([{ position: 1, title: "Un", blocks: ["<p>Été</p>"] }], "ete")
 *           → [{ chapter: 1, block: 0, offset: 0, snippet: "Été", … }]
 */
export function searchChapters(
  chapters: SearchableChapter[],
  query: string,
  maxHits = SEARCH_MAX_HITS,
): SearchHit[] {
  const needle = normalizeWithMap(query).normalized;
  if (!needle) return [];
  const hits: SearchHit[] = [];

  for (const chapter of chapters) {
    for (let block = 0; block < chapter.blocks.length; block++) {
      const text = blockText(chapter.blocks[block]);
      const { normalized, map } = normalizeWithMap(text);

      let from = normalized.indexOf(needle);
      while (from !== -1) {
        const start = map[from];
        const end = map[from + needle.length - 1] + 1;
        hits.push(makeHit(chapter, block, text, start, end));
        if (hits.length >= maxHits) return hits;
        from = normalized.indexOf(needle, from + needle.length);
      }
    }
  }
  return hits;
}

/** Construit un résultat avec son extrait de contexte. */
function makeHit(
  chapter: SearchableChapter,
  block: number,
  text: string,
  start: number,
  end: number,
): SearchHit {
  const from = Math.max(0, start - SNIPPET_CONTEXT);
  const to = Math.min(text.length, end + SNIPPET_CONTEXT);
  const prefix = from > 0 ? "…" : "";
  const suffix = to < text.length ? "…" : "";
  return {
    chapter: chapter.position,
    block,
    offset: start,
    title: chapter.title,
    snippet: `${prefix}${text.slice(from, to)}${suffix}`,
    matchStart: prefix.length + start - from,
    matchLength: end - start,
  };
}
