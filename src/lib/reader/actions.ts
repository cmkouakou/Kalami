/**
 * =============================================================
 *  Fichier    : actions.ts (reader)
 *  Projet     : Kalami
 *  Description: Actions serveur des signets nommés et des annotations (surlignage, note),
 *               appelées par la liseuse. Lecteur connecté uniquement ; la RLS limite
 *               l'écriture à ses propres lignes et des déclencheurs plafonnent leur nombre.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-10
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, annotations.ts, position.ts,
 *               queries.ts
 * =============================================================
 */

"use server";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { cleanNote, cleanQuote, isHighlightColor, parseAnchor } from "./annotations";
import { parsePosition } from "./position";
import {
  type BookmarkRow,
  HIGHLIGHT_COLUMNS,
  type HighlightRow,
  toBookmark,
  toHighlight,
} from "./queries";
import type { Bookmark, Highlight, HighlightColor, ReaderPosition } from "./types";

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

// ==================== ANNOTATIONS ====================

export type HighlightResult = { ok: true; highlight: Highlight } | { ok: false; error: string };

/**
 * Surligne un passage, avec une note facultative.
 * @param bookId - Identifiant du livre
 * @param anchor - Chapitre, début et fin du passage (bloc + décalage)
 * @param color  - Couleur du surlignage
 * @param quote  - Texte du passage (raccourci à 1000 caractères)
 * @param note   - Note du lecteur, ou null
 * @returns Surlignage créé, ou message d'erreur affichable
 */
export async function addHighlight(
  bookId: string,
  anchor: unknown,
  color: HighlightColor,
  quote: string,
  note: string | null = null,
): Promise<HighlightResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.reader.annotations.signInRequired };

  const safeAnchor = parseAnchor(anchor);
  const cleanText = cleanQuote(quote);
  const cleanedNote = cleanNote(note);
  if (!isUuid(bookId) || !safeAnchor || !cleanText || !isHighlightColor(color)) {
    return { ok: false, error: t.reader.annotations.error };
  }
  if (!cleanedNote.valid) return { ok: false, error: t.reader.annotations.noteTooLong };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .insert({
      user_id: user.id,
      book_id: bookId,
      chapter_position: safeAnchor.chapter,
      start_block: safeAnchor.start.block,
      start_offset: safeAnchor.start.offset,
      end_block: safeAnchor.end.block,
      end_offset: safeAnchor.end.offset,
      color,
      quote: cleanText,
      note: cleanedNote.note,
    })
    .select(HIGHLIGHT_COLUMNS)
    .single<HighlightRow>();

  if (error?.code === LIMIT_EXCEEDED) return { ok: false, error: t.reader.annotations.tooMany };
  if (error || !data) return { ok: false, error: t.reader.annotations.error };
  return { ok: true, highlight: toHighlight(data) };
}

/**
 * Change la couleur ou la note d'un surlignage du lecteur connecté.
 * @param highlightId - Identifiant du surlignage
 * @param changes     - Nouvelle couleur et/ou nouvelle note (chaîne vide = note retirée)
 * @returns Surlignage modifié, ou message d'erreur affichable
 */
export async function updateHighlight(
  highlightId: string,
  changes: { color?: HighlightColor; note?: string | null },
): Promise<HighlightResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.reader.annotations.signInRequired };
  if (!isUuid(highlightId)) return { ok: false, error: t.reader.annotations.error };

  const patch: { color?: HighlightColor; note?: string | null } = {};
  if (changes.color !== undefined) {
    if (!isHighlightColor(changes.color)) return { ok: false, error: t.reader.annotations.error };
    patch.color = changes.color;
  }
  if (changes.note !== undefined) {
    const cleaned = cleanNote(changes.note);
    if (!cleaned.valid) return { ok: false, error: t.reader.annotations.noteTooLong };
    patch.note = cleaned.note;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .update(patch)
    .eq("id", highlightId)
    .select(HIGHLIGHT_COLUMNS)
    .single<HighlightRow>();
  if (error || !data) return { ok: false, error: t.reader.annotations.error };
  return { ok: true, highlight: toHighlight(data) };
}

/**
 * Supprime un surlignage (et sa note) du lecteur connecté.
 * @param highlightId - Identifiant du surlignage
 * @returns true si la suppression a réussi (ou si le surlignage n'existait déjà plus)
 */
export async function deleteHighlight(highlightId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !isUuid(highlightId)) return false;

  const supabase = await createClient();
  const { error } = await supabase.from("highlights").delete().eq("id", highlightId);
  return !error;
}
