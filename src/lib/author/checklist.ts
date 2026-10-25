/**
 * =============================================================
 *  Fichier    : checklist.ts
 *  Projet     : Kalami
 *  Description: Liste de vérification avant soumission d'un livre (atelier de l'auteur,
 *               v0.15.0) : couvertures, résumé, mots-clés, catégorie, prix, manuscrit.
 *               Fonction pure : la page traduit les clés et affiche l'état de chaque point.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== TYPES ====================

/** Champs du livre utiles à la vérification (sous-ensemble de AuthorBook). */
export type ChecklistBook = {
  title: string;
  summary: string | null;
  keywords: string | null;
  category_id: string | null;
  cover_path: string | null;
  back_cover_path: string | null;
  book_prices: unknown[];
  current: unknown | null;
  pending: unknown | null;
};

export type ChecklistKey =
  | "title"
  | "cover"
  | "backCover"
  | "summary"
  | "keywords"
  | "category"
  | "prices"
  | "manuscript";

export type ChecklistItem = { key: ChecklistKey; done: boolean };

// ==================== CONSTANTES ====================

/** Longueur minimale conseillée du résumé (caractères). */
export const SUMMARY_MIN = 200;
/** Nombre minimal conseillé de mots-clés. */
export const KEYWORDS_MIN = 3;
const TITLE_MIN = 2;

// ==================== VÉRIFICATION ====================

/** Mots-clés séparés par des virgules ou des points-virgules, vides retirés. */
export function splitKeywords(keywords: string | null): string[] {
  return (keywords ?? "")
    .split(/[,;]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

/**
 * Points de la liste de vérification, dans l'ordre d'affichage.
 * @param book - Livre de l'auteur
 * @returns Un point par critère, avec son état
 *
 * Exemple :
 *   bookChecklist(book).filter((item) => !item.done)
 */
export function bookChecklist(book: ChecklistBook): ChecklistItem[] {
  return [
    { key: "title", done: book.title.trim().length >= TITLE_MIN },
    { key: "cover", done: Boolean(book.cover_path) },
    { key: "backCover", done: Boolean(book.back_cover_path) },
    { key: "summary", done: (book.summary ?? "").trim().length >= SUMMARY_MIN },
    { key: "keywords", done: splitKeywords(book.keywords).length >= KEYWORDS_MIN },
    { key: "category", done: Boolean(book.category_id) },
    { key: "prices", done: book.book_prices.length > 0 },
    { key: "manuscript", done: Boolean(book.pending ?? book.current) },
  ];
}
