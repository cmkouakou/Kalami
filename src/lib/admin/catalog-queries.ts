/**
 * =============================================================
 *  Fichier    : catalog-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures du catalogue pour l'administration : client de session (RLS
 *               administrateur), sans cache, tous statuts visibles (brouillons compris).
 *               Les appelants doivent avoir exécuté requireAdmin() au préalable.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import type { Author, BookLanguage, BookStatus, Category, Price } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type AdminBookRow = {
  id: string;
  slug: string;
  title: string;
  status: BookStatus;
  is_featured: boolean;
  cover_path: string | null;
  updated_at: string;
  author: { display_name: string };
  category: { name: string } | null;
};

export type AdminBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  edition: string | null;
  summary: string | null;
  keywords: string | null;
  language: BookLanguage;
  author_id: string;
  category_id: string | null;
  page_count: number | null;
  chapter_count: number | null;
  publication_year: number | null;
  is_featured: boolean;
  status: BookStatus;
  rejection_reason: string | null;
  cover_path: string | null;
  book_prices: Price[];
};

export type AdminAuthorRow = Author & { book_count: number };

export type DashboardCounts = {
  published: number;
  drafts: number;
  authors: number;
  categories: number;
  submissions: number;
};

/** Lève une erreur explicite si la lecture a échoué. */
function check<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

// ==================== TABLEAU DE BORD ====================

/**
 * Compteurs affichés sur l'accueil de l'administration.
 * @returns Livres publiés, brouillons, auteurs, catégories et soumissions en attente
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createClient();
  const count = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true });

  const [published, drafts, authors, categories, submissions] = await Promise.all([
    count("books").eq("status", "published"),
    count("books").eq("status", "draft"),
    count("authors"),
    count("categories"),
    count("book_submissions").eq("status", "submitted"),
  ]);
  for (const result of [published, drafts, authors, categories, submissions]) {
    if (result.error) throw new Error(`Comptage impossible : ${result.error.message}`);
  }
  return {
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    authors: authors.count ?? 0,
    categories: categories.count ?? 0,
    submissions: submissions.count ?? 0,
  };
}

// ==================== CATÉGORIES ====================

/** Toutes les catégories, dans l'ordre d'affichage. */
export async function listCategoriesAdmin(): Promise<Category[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("categories")
    .select("id, slug, name, description, position")
    .order("position")
    .order("name");
  return check(result, "catégories") as Category[];
}

// ==================== AUTEURS ====================

/** Tous les auteurs avec leur nombre de livres (tous statuts). */
export async function listAuthorsAdmin(): Promise<AdminAuthorRow[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("authors")
    .select("id, slug, display_name, bio, photo_path, books(count)")
    .order("display_name");
  const rows = check(result, "auteurs") as unknown as (Author & { books: { count: number }[] })[];
  return rows.map(({ books, ...author }) => ({ ...author, book_count: books[0]?.count ?? 0 }));
}

/**
 * Un auteur, pour le formulaire de modification.
 * @param id - Identifiant UUID
 * @returns L'auteur, ou null s'il n'existe pas
 */
export async function getAuthorAdmin(id: string): Promise<Author | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("authors")
    .select("id, slug, display_name, bio, photo_path")
    .eq("id", id)
    .maybeSingle();
  return check(result, "auteur") as Author | null;
}

// ==================== LIVRES ====================

/** Tous les livres (tous statuts), les plus récemment modifiés en premier. */
export async function listBooksAdmin(): Promise<AdminBookRow[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("books")
    .select(
      "id, slug, title, status, is_featured, cover_path, updated_at, " +
        "author:authors!inner(display_name), category:categories(name)",
    )
    .order("updated_at", { ascending: false });
  return check(result, "livres") as unknown as AdminBookRow[];
}

/**
 * Un livre et ses prix, pour le formulaire de modification.
 * @param id - Identifiant UUID
 * @returns Le livre, ou null s'il n'existe pas
 */
export async function getBookAdmin(id: string): Promise<AdminBook | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("books")
    .select(
      "id, slug, title, subtitle, edition, summary, keywords, language, author_id, " +
        "category_id, page_count, chapter_count, publication_year, is_featured, status, " +
        "rejection_reason, cover_path, book_prices(currency, amount_minor)",
    )
    .eq("id", id)
    .maybeSingle();
  return check(result, "livre") as unknown as AdminBook | null;
}

/** Options des listes déroulantes du formulaire de livre. */
export async function getBookFormOptions(): Promise<{
  authors: { id: string; display_name: string }[];
  categories: { id: string; name: string }[];
}> {
  const supabase = await createClient();
  const [authors, categories] = await Promise.all([
    supabase.from("authors").select("id, display_name").order("display_name"),
    supabase.from("categories").select("id, name").order("position").order("name"),
  ]);
  return {
    authors: check(authors, "auteurs") ?? [],
    categories: check(categories, "catégories") ?? [],
  };
}
