/**
 * =============================================================
 *  Fichier    : manuscript.ts
 *  Projet     : Kalami
 *  Description: Conversion d'un manuscrit déposé dans le seau privé (DOCX/EPUB) puis
 *               enregistrement de la version par une fonction SQL : version courante
 *               (administrateur) ou version en attente de validation (auteur). Serveur
 *               uniquement ; l'appelant vérifie la session.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/content/convert-*.ts, lib/content/types.ts, supabase
 * =============================================================
 */

import "server-only";

import { getDictionary, interpolate } from "@/i18n";
import type { Supabase } from "@/lib/admin/audit";
import type { FormState } from "@/lib/auth/actions";
import { convertDocx } from "@/lib/content/convert-docx";
import { convertEpub } from "@/lib/content/convert-epub";
import {
  ConversionError,
  MANUSCRIPT_MAX_BYTES,
  MANUSCRIPTS_BUCKET,
  type ConvertedChapter,
  type ManuscriptFormat,
} from "@/lib/content/types";

const t = getDictionary();
const l = t.admin.content;
const e = t.admin.errors;

/** Chemin d'un manuscrit envoyé par le navigateur : « livres/{livre}/{uuid}.{ext} ». */
const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const MANUSCRIPT_PATH_PATTERN = new RegExp(
  `^livres/(${UUID_SOURCE})/${UUID_SOURCE}[.](docx|epub)$`,
);

/** Fonction SQL qui enregistre la version convertie. */
export type SaveVersionRpc = "admin_save_book_version" | "author_save_book_version";

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Format du manuscrit si le chemin appartient bien au livre, sinon null.
 * @param path   - Chemin envoyé par le navigateur
 * @param bookId - Identifiant du livre
 */
export function manuscriptFormat(path: unknown, bookId: string): ManuscriptFormat | null {
  if (typeof path !== "string") return null;
  const match = MANUSCRIPT_PATH_PATTERN.exec(path);
  if (!match || match[1] !== bookId) return null;
  return match[2] as ManuscriptFormat;
}

/** Convertit le fichier selon son format, avec les titres par défaut du dictionnaire. */
function convert(
  format: ManuscriptFormat,
  data: Uint8Array,
  bookTitle: string,
): Promise<ConvertedChapter[]> {
  if (format === "docx") {
    return convertDocx(data, { book: bookTitle, opening: t.content.openingTitle });
  }
  const chapter = (n: number) => interpolate(t.content.chapterTitle, { n: String(n) });
  return convertEpub(data, { chapter });
}

// ==================== CONVERSION ====================

/**
 * Télécharge, convertit et enregistre un manuscrit.
 * @param supabase - Client de la session (les politiques du seau s'appliquent)
 * @param bookId   - Identifiant du livre (déjà validé)
 * @param path     - Chemin du fichier dans le seau « manuscripts »
 * @param rpc      - Fonction SQL d'enregistrement
 * @returns Message de réussite, ou d'erreur ; code SQL éventuel pour l'appelant
 *
 * Un fichier refusé est supprimé du seau ; un fichier converti est conservé (source de
 * la version, utile pour une reconversion future).
 */
export async function convertStoredManuscript(
  supabase: Supabase,
  bookId: string,
  path: string,
  rpc: SaveVersionRpc,
): Promise<FormState & { sqlError?: string }> {
  const format = manuscriptFormat(path, bookId);
  if (!format) return { error: e.generic };

  const { data: book } = await supabase
    .from("books")
    .select("title")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) return { error: e.generic };

  const download = await supabase.storage.from(MANUSCRIPTS_BUCKET).download(path);
  if (download.error || !download.data) return { error: e.generic };
  if (download.data.size > MANUSCRIPT_MAX_BYTES) {
    await supabase.storage.from(MANUSCRIPTS_BUCKET).remove([path]);
    return { error: l.tooLarge };
  }

  let chapters: ConvertedChapter[];
  try {
    const data = new Uint8Array(await download.data.arrayBuffer());
    chapters = await convert(format, data, book.title);
  } catch (error) {
    if (!(error instanceof ConversionError)) throw error;
    await supabase.storage.from(MANUSCRIPTS_BUCKET).remove([path]);
    return { error: l.errors[error.code] };
  }

  const { error } = await supabase.rpc(rpc, {
    p_book_id: bookId,
    p_source_format: format,
    p_source_path: path,
    p_chapters: chapters,
  });
  if (error) return { error: e.generic, sqlError: error.message };
  return { message: interpolate(l.converted, { count: String(chapters.length) }) };
}
