/**
 * =============================================================
 *  Fichier    : content-queries.ts
 *  Projet     : Kalami
 *  Description: Lectures de l'administration du contenu d'un livre : version convertie
 *               courante, sommaire, règles de l'extrait et droits de lecture.
 *               Jamais mises en cache (données privées, session administrateur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { requireAdmin } from "@/lib/auth/dal";
import type { TocEntry } from "@/lib/catalog/types";
import type { ManuscriptFormat } from "@/lib/content/types";
import { createClient } from "@/lib/supabase/server";

/** Version convertie affichée en administration. */
export type BookVersionSummary = {
  id: string;
  version_number: number;
  source_format: ManuscriptFormat;
  chapter_count: number;
  word_count: number;
  created_at: string;
};

/** Droit de lecture affiché en administration. */
export type EntitlementRow = {
  id: string;
  email: string;
  source: "purchase" | "admin_grant";
  note: string | null;
  created_at: string;
  revoked_at: string | null;
};

/** Ensemble des données de la section « Contenu du livre ». */
export type BookContentAdmin = {
  version: BookVersionSummary | null;
  toc: TocEntry[];
  preview_chapters: number;
  preview_cut_block: number | null;
  entitlements: EntitlementRow[];
};

/**
 * Contenu d'un livre pour l'administration.
 * @param bookId - Identifiant (uuid déjà validé) du livre
 * @returns Données de la section, ou null si le livre n'existe pas
 */
export async function getBookContentAdmin(bookId: string): Promise<BookContentAdmin | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select("preview_chapters, preview_cut_block, current_version_id")
    .eq("id", bookId)
    .maybeSingle();
  if (error) throw new Error(`Lecture du livre impossible : ${error.message}`);
  if (!book) return null;

  const [version, toc, entitlements] = await Promise.all([
    book.current_version_id
      ? supabase
          .from("book_versions")
          .select("id, version_number, source_format, chapter_count, word_count, created_at")
          .eq("id", book.current_version_id)
          .maybeSingle<BookVersionSummary>()
      : Promise.resolve({ data: null, error: null }),
    supabase.rpc("get_book_toc", { p_book_id: bookId }),
    supabase.rpc("admin_list_entitlements", { p_book_id: bookId }),
  ]);
  if (version.error) throw new Error(`Lecture de la version impossible : ${version.error.message}`);
  if (toc.error) throw new Error(`Lecture du sommaire impossible : ${toc.error.message}`);
  if (entitlements.error) {
    throw new Error(`Lecture des droits impossible : ${entitlements.error.message}`);
  }

  return {
    version: version.data,
    toc: toc.data as TocEntry[],
    preview_chapters: book.preview_chapters,
    preview_cut_block: book.preview_cut_block,
    entitlements: entitlements.data as EntitlementRow[],
  };
}
