/**
 * =============================================================
 *  Fichier    : types.ts
 *  Projet     : Kalami
 *  Description: Types du catalogue (catégories, auteurs, livres, prix), partagés entre le
 *               serveur et le client.
 *  Auteur     : Claude Marcel
 *               v1.1 : nombre de livres publiés par catégorie, livre du plan du site.
 *  Version    : 1.1
 *  Date       : 2026-10-28
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

/** Catégorie et son nombre de livres publiés (0 = catégorie vide, cachée de la navigation). */
export type CategorySummary = Category & { published_count: number };

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
  back_cover_path: string | null;
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

/** Entrée du sommaire d'un livre (sans contenu), renvoyée par get_book_toc. */
export type TocEntry = {
  chapter_position: number;
  title: string;
  word_count: number;
  /** Nombre de blocs (paragraphes, intertitres…) : sert à régler la coupure de l'extrait. */
  block_count: number;
  /** Chapitre lisible gratuitement (en tout ou en partie). */
  is_preview: boolean;
};

/** Livre publié tel que listé dans sitemap.xml. */
export type SitemapBook = {
  slug: string;
  updated_at: string;
  author: { slug: string };
};
