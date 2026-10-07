/**
 * =============================================================
 *  Fichier    : queries.ts
 *  Projet     : Kalami
 *  Description: Lectures publiques du catalogue, mises en cache ('use cache') et invalidées
 *               par l'étiquette « catalogue » lors des modifications faites en administration.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: next/cache, supabase/public.ts
 * =============================================================
 */

import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import type { Author, BookCard, BookDetail, BookSearch, Category } from "./types";

// ==================== CONSTANTES ====================

/** Étiquette de cache commune à toutes les lectures du catalogue. */
export const CATALOG_TAG = "catalogue";

/** Nombre de résultats par page de recherche. */
export const SEARCH_PAGE_SIZE = 24;

const CARD_COLUMNS =
  "id, slug, title, subtitle, cover_path, language, " +
  "author:authors!inner(slug, display_name), book_prices(currency, amount_minor)";

const DETAIL_COLUMNS =
  "id, slug, title, subtitle, edition, summary, keywords, cover_path, language, " +
  "page_count, chapter_count, publication_year, published_at, " +
  "author:authors!inner(id, slug, display_name, bio, photo_path), " +
  "category:categories(slug, name), book_prices(currency, amount_minor)";

// ==================== CATÉGORIES ====================

/**
 * Liste des catégories, dans l'ordre d'affichage.
 * @returns Catégories triées par position puis par nom
 */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, description, position")
    .order("position")
    .order("name");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return data as Category[];
}

/**
 * Catégorie et ses livres publiés.
 * @param slug - Identifiant lisible de la catégorie
 * @returns La catégorie et ses livres, ou null si elle n'existe pas
 */
export async function getCategoryWithBooks(
  slug: string,
): Promise<{ category: Category; books: BookCard[] } | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, position")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Lecture de la catégorie impossible : ${error.message}`);
  if (!category) return null;

  const books = await supabase
    .from("books")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false });
  if (books.error) throw new Error(`Lecture des livres impossible : ${books.error.message}`);
  return { category: category as Category, books: books.data as unknown as BookCard[] };
}

// ==================== LIVRES ====================

/**
 * Derniers livres publiés (nouveautés de l'accueil).
 * @param limit - Nombre maximal de livres
 * @returns Livres du plus récent au plus ancien
 */
export async function getNewReleases(limit = 8): Promise<BookCard[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("books")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Lecture des nouveautés impossible : ${error.message}`);
  return data as unknown as BookCard[];
}

/**
 * Livres mis en avant par l'administration (sélection de l'accueil).
 * @param limit - Nombre maximal de livres
 * @returns Livres publiés marqués « à la une »
 */
export async function getFeaturedBooks(limit = 8): Promise<BookCard[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("books")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Lecture de la sélection impossible : ${error.message}`);
  return data as unknown as BookCard[];
}

/**
 * Fiche complète d'un livre publié.
 * @param slug - Identifiant lisible du livre
 * @returns La fiche, ou null si le livre n'existe pas ou n'est pas publié
 */
export async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("books")
    .select(DETAIL_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Lecture du livre impossible : ${error.message}`);
  return data as unknown as BookDetail | null;
}

// ==================== AUTEURS ====================

/**
 * Page publique d'un auteur et ses livres publiés.
 * @param slug - Identifiant lisible de l'auteur
 * @returns L'auteur et ses livres, ou null s'il n'existe pas
 */
export async function getAuthorWithBooks(
  slug: string,
): Promise<{ author: Author; books: BookCard[] } | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const { data: author, error } = await supabase
    .from("authors")
    .select("id, slug, display_name, bio, photo_path")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Lecture de l'auteur impossible : ${error.message}`);
  if (!author) return null;

  const books = await supabase
    .from("books")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .eq("author_id", author.id)
    .order("published_at", { ascending: false });
  if (books.error) throw new Error(`Lecture des livres impossible : ${books.error.message}`);
  return { author: author as Author, books: books.data as unknown as BookCard[] };
}

// ==================== RECHERCHE ====================

/**
 * Recherche publique (titre, mots-clés, résumé, auteur) avec filtres.
 *
 * Demande une ligne de plus que la taille de page pour savoir s'il existe une page suivante.
 *
 * @param search - Critères (texte, catégorie, langue, prix maximal dans une devise, page)
 * @returns Livres de la page demandée et indicateur de page suivante
 */
export async function searchBooks(
  search: BookSearch,
): Promise<{ books: BookCard[]; hasMore: boolean }> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const page = Math.max(1, search.page ?? 1);
  const { data, error } = await createPublicClient()
    .rpc("search_books", {
      p_query: search.query ?? null,
      p_category: search.category ?? null,
      p_language: search.language ?? null,
      p_currency: search.currency ?? null,
      p_max_price: search.maxPriceMinor ?? null,
      p_limit: SEARCH_PAGE_SIZE + 1,
      p_offset: (page - 1) * SEARCH_PAGE_SIZE,
    })
    .select(CARD_COLUMNS);
  if (error) throw new Error(`Recherche impossible : ${error.message}`);

  const rows = data as unknown as BookCard[];
  return { books: rows.slice(0, SEARCH_PAGE_SIZE), hasMore: rows.length > SEARCH_PAGE_SIZE };
}
