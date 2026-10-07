/**
 * =============================================================
 *  Fichier    : types.ts
 *  Projet     : Kalami
 *  Description: Types du catalogue (catégories, auteurs, livres, prix), partagés entre le
 *               serveur et le client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 * =============================================================
 */

/** Devises acceptées (cahier §3.5) ; montants en unité mineure. */
export const CURRENCIES = ["XOF", "EUR", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BOOK_LANGUAGES = ["fr", "en"] as const;
export type BookLanguage = (typeof BOOK_LANGUAGES)[number];

export const BOOK_STATUSES = ["draft", "submitted", "published", "rejected"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export type Price = { currency: Currency; amount_minor: number };

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
};

export type AuthorSummary = { slug: string; display_name: string };

export type Author = AuthorSummary & {
  id: string;
  bio: string | null;
  photo_path: string | null;
};

/** Données nécessaires à une carte de livre (listes, recherche). */
export type BookCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_path: string | null;
  language: BookLanguage;
  author: AuthorSummary;
  book_prices: Price[];
};

/** Fiche complète d'un livre publié. */
export type BookDetail = Omit<BookCard, "author"> & {
  edition: string | null;
  summary: string | null;
  keywords: string | null;
  page_count: number | null;
  chapter_count: number | null;
  publication_year: number | null;
  published_at: string | null;
  author: Author;
  category: Pick<Category, "slug" | "name"> | null;
};

/** Critères de recherche publique (valeurs sérialisables pour le cache). */
export type BookSearch = {
  query?: string;
  category?: string;
  language?: BookLanguage;
  currency?: Currency;
  maxPriceMinor?: number;
  page?: number;
};
