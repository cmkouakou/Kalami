/**
 * =============================================================
 *  Fichier    : actions.ts (reader)
 *  Projet     : Kalami
 *  Description: Actions serveur des signets nommés (ajout, suppression), appelées par la
 *               liseuse. Lecteur connecté uniquement ; la RLS limite l'écriture à ses
 *               propres signets et un déclencheur plafonne leur nombre par livre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, position.ts, queries.ts
 * =============================================================
 */

"use server";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { parsePosition } from "./position";
import { type BookmarkRow, toBookmark } from "./queries";
import type { Bookmark, ReaderPosition } from "./types";

const t = getDictionary();

/** Longueur maximale du nom d'un signet (même règle que la base). */
const MAX_LABEL_LENGTH = 120;

/** Code PostgreSQL levé par le déclencheur de plafond (program_limit_exceeded). */
const LIMIT_EXCEEDED = "54000";

export type BookmarkResult = { ok: true; bookmark: Bookmark } | { ok: false; error: string };

/**
 * Ajoute un signet à la position donnée.
 * @param bookId   - Identifiant du livre
 * @param position - Position (chapitre, bloc, décalage)
 * @param label    - Nom choisi par le lecteur (1 à 120 caractères)
 * @returns Signet créé, ou message d'erreur affichable
 */
export async function addBookmark(
  bookId: string,
  position: ReaderPosition,
  label: string,
): Promise<BookmarkResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.reader.bookmarks.signInRequired };

  const safePosition = parsePosition(position);
  const cleanLabel = typeof label === "string" ? label.replace(/\s+/g, " ").trim() : "";
  if (!isUuid(bookId) || !safePosition) return { ok: false, error: t.reader.bookmarks.error };
  if (!cleanLabel || cleanLabel.length > MAX_LABEL_LENGTH) {
    return { ok: false, error: t.reader.bookmarks.invalid };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      book_id: bookId,
      chapter_position: safePosition.chapter,
      block_index: safePosition.block,
      char_offset: safePosition.offset,
      label: cleanLabel,
    })
    .select("id, chapter_position, block_index, char_offset, label, created_at")
    .single<BookmarkRow>();

  if (error?.code === LIMIT_EXCEEDED) return { ok: false, error: t.reader.bookmarks.tooMany };
  if (error || !data) return { ok: false, error: t.reader.bookmarks.error };
  return { ok: true, bookmark: toBookmark(data) };
}

/**
 * Supprime un signet du lecteur connecté.
 * @param bookmarkId - Identifiant du signet
 * @returns true si la suppression a réussi (ou si le signet n'existait déjà plus)
 */
export async function deleteBookmark(bookmarkId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !isUuid(bookmarkId)) return false;

  const supabase = await createClient();
  const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
  return !error;
}
