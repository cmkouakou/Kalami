/**
 * =============================================================
 *  Fichier    : queries.ts (reader)
 *  Projet     : Kalami
 *  Description: Données de départ de la liseuse, lues côté serveur à chaque ouverture :
 *               livre publié, sommaire, accès (extrait ou livre entier), position et signets
 *               du lecteur connecté, texte du filigrane. Aucun contenu de chapitre ici : il
 *               passe uniquement par l'API des chapitres, qui revérifie les droits.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/catalog/queries.ts, lib/content/chapters.ts, lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { type CurrentUser, getCurrentUser } from "@/lib/auth/dal";
import { getBookBySlug, getBookToc } from "@/lib/catalog/queries";
import { getReaderAccess } from "@/lib/content/chapters";
import { createClient } from "@/lib/supabase/server";

import type { Bookmark, ReaderBootstrap, SavedPosition } from "./types";

/** Longueur de l'identifiant de droit affichée dans le filigrane. */
const WATERMARK_ID_LENGTH = 8;

type PositionRow = {
  chapter_position: number;
  block_index: number;
  char_offset: number;
  progress: number | string;
  updated_at: string;
};

export type BookmarkRow = {
  id: string;
  chapter_position: number;
  block_index: number;
  char_offset: number;
  label: string;
  created_at: string;
};

// ==================== LECTEUR CONNECTÉ ====================

/** Position et signets du lecteur (client utilisateur : la RLS limite à ses lignes). */
async function loadReaderState(
  bookId: string,
): Promise<{ position: SavedPosition | null; bookmarks: Bookmark[] }> {
  const supabase = await createClient();
  const [positionResult, bookmarksResult] = await Promise.all([
    supabase
      .from("reading_positions")
      .select("chapter_position, block_index, char_offset, progress, updated_at")
      .eq("book_id", bookId)
      .maybeSingle<PositionRow>(),
    supabase
      .from("bookmarks")
      .select("id, chapter_position, block_index, char_offset, label, created_at")
      .eq("book_id", bookId)
      .order("chapter_position")
      .order("block_index")
      .order("char_offset")
      .returns<BookmarkRow[]>(),
  ]);
  if (positionResult.error) {
    throw new Error(`Lecture de la position impossible : ${positionResult.error.message}`);
  }
  if (bookmarksResult.error) {
    throw new Error(`Lecture des signets impossible : ${bookmarksResult.error.message}`);
  }

  const row = positionResult.data;
  const position: SavedPosition | null = row && {
    chapter: row.chapter_position,
    block: row.block_index,
    offset: row.char_offset,
    progress: Number(row.progress),
    updatedAt: row.updated_at,
  };
  const bookmarks = (bookmarksResult.data ?? []).map(toBookmark);
  return { position, bookmarks };
}

/**
 * État de lecture affiché sur la fiche du livre (bouton « Lire » / « Reprendre »).
 * Une erreur de lecture de la position ne bloque pas la fiche : bouton par défaut.
 * @param bookId - Identifiant du livre
 * @returns Accès au livre entier, et avancement enregistré (0 à 1) ou null
 */
export async function getReadingStatus(
  bookId: string,
): Promise<{ full: boolean; progress: number | null }> {
  const user = await getCurrentUser();
  if (!user) return { full: false, progress: null };

  const supabase = await createClient();
  const [access, { data }] = await Promise.all([
    getReaderAccess(bookId, user),
    supabase
      .from("reading_positions")
      .select("progress")
      .eq("book_id", bookId)
      .maybeSingle<{ progress: number | string }>(),
  ]);
  return { full: access.full, progress: data ? Number(data.progress) : null };
}

/** Convertit une ligne de la table bookmarks. */
export function toBookmark(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    chapter: row.chapter_position,
    block: row.block_index,
    offset: row.char_offset,
    label: row.label,
    createdAt: row.created_at,
  };
}

/**
 * Texte du filigrane : courriel du lecteur et identifiant court de son droit de lecture
 * (deviendra le numéro de commande au Sprint 5). Permet de retrouver l'origine d'une fuite.
 */
function watermarkText(user: CurrentUser, entitlementId: string | null): string {
  const who = user.email ?? user.id;
  return entitlementId ? `${who} · ${entitlementId.slice(0, WATERMARK_ID_LENGTH)}` : who;
}

// ==================== DONNÉES DE DÉPART ====================

/**
 * Prépare l'ouverture de la liseuse.
 * @param slug             - Identifiant lisible du livre
 * @param requestedChapter - Chapitre demandé dans l'URL, ou null
 * @returns Données de départ, ou null si le livre n'existe pas ou n'est pas publié
 */
export async function getReaderData(
  slug: string,
  requestedChapter: number | null,
): Promise<ReaderBootstrap | null> {
  const book = await getBookBySlug(slug);
  if (!book) return null;

  const [toc, user] = await Promise.all([getBookToc(book.id), getCurrentUser()]);
  const access = await getReaderAccess(book.id, user);
  const state = user ? await loadReaderState(book.id) : { position: null, bookmarks: [] };

  return {
    book: {
      id: book.id,
      slug: book.slug,
      title: book.title,
      authorName: book.author.display_name,
      language: book.language,
      prices: book.book_prices,
    },
    toc,
    access: access.full ? "full" : "preview",
    reader: user ? { email: user.email } : null,
    // Filigrane pour tout lecteur connecté ; aucun pour un visiteur (extrait public)
    watermark: user ? watermarkText(user, access.entitlementId) : null,
    position: state.position,
    bookmarks: state.bookmarks,
    requestedChapter,
  };
}
