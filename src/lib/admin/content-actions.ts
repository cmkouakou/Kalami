/**
 * =============================================================
 *  Fichier    : content-actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur d'administration du contenu d'un livre : conversion d'un
 *               manuscrit déposé (DOCX/EPUB), règles de l'extrait gratuit, octroi et retrait
 *               des droits de lecture. Toute fonction exportée est une action publique :
 *               arguments vérifiés, session administrateur (aal2) exigée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: lib/content/*, lib/admin/validation.ts, lib/admin/audit.ts, supabase
 * =============================================================
 */

"use server";

import { updateTag } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import { audit } from "@/lib/admin/audit";
import { isUuid, parseGrant, parsePreviewRule } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import type { TocEntry } from "@/lib/catalog/types";
import { convertDocx } from "@/lib/content/convert-docx";
import { convertEpub } from "@/lib/content/convert-epub";
import {
  ConversionError,
  MANUSCRIPT_MAX_BYTES,
  MANUSCRIPTS_BUCKET,
  type ConvertedChapter,
  type ManuscriptFormat,
} from "@/lib/content/types";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const l = t.admin.content;
const e = t.admin.errors;

/** Chemin d'un manuscrit envoyé par le navigateur : « livres/{livre}/{uuid}.{ext} ». */
const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const MANUSCRIPT_PATH_PATTERN = new RegExp(
  `^livres/(${UUID_SOURCE})/${UUID_SOURCE}[.](docx|epub)$`,
);

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Format d'un manuscrit si son chemin appartient bien au livre, sinon null.
 * @param path   - Chemin envoyé par le navigateur
 * @param bookId - Identifiant du livre modifié
 */
function manuscriptFormat(path: unknown, bookId: string): ManuscriptFormat | null {
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

// ==================== MANUSCRIT ====================

/**
 * Convertit un manuscrit déjà déposé dans le seau privé et en fait la version courante.
 * @param bookId - Identifiant du livre
 * @param path   - Chemin du fichier dans le seau « manuscripts »
 * @returns Message de réussite (nombre de chapitres) ou d'erreur
 *
 * Un fichier refusé est supprimé du seau ; un fichier converti est conservé (source de
 * la version, utile pour une reconversion future).
 */
export async function convertManuscript(bookId: string, path: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(bookId)) return { error: e.generic };
  const format = manuscriptFormat(path, bookId);
  if (!format) return { error: e.generic };

  const supabase = await createClient();
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

  // La fonction SQL écrit elle-même l'entrée d'audit « book.version_created »
  const { error } = await supabase.rpc("admin_save_book_version", {
    p_book_id: bookId,
    p_source_format: format,
    p_source_path: path,
    p_chapters: chapters,
  });
  if (error) return { error: e.generic };

  updateTag(CATALOG_TAG);
  return { message: interpolate(l.converted, { count: String(chapters.length) }) };
}

// ==================== EXTRAIT GRATUIT ====================

/** Enregistre les règles de l'extrait (identifiant du livre lié par .bind). */
export async function updatePreviewRule(
  bookId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(bookId)) return { error: e.generic };

  const supabase = await createClient();
  const toc = await supabase.rpc("get_book_toc", { p_book_id: bookId });
  if (toc.error) return { error: e.generic };

  const parsed = parsePreviewRule(formData, (toc.data ?? []) as TocEntry[]);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await supabase.from("books").update(parsed.value).eq("id", bookId);
  if (error) return { error: e.generic };

  await audit(supabase, "book.preview_rule", "book", bookId, parsed.value);
  updateTag(CATALOG_TAG);
  return { message: t.admin.common.saved };
}

// ==================== DROITS DE LECTURE ====================

/** Accorde l'accès complet au livre à un compte existant (identifiant lié par .bind). */
export async function grantEntitlement(
  bookId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(bookId)) return { error: e.generic };
  const parsed = parseGrant(formData);
  if (!parsed.ok) return { error: parsed.error };

  // La fonction SQL vérifie le rôle, trouve le compte et écrit l'entrée d'audit
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_entitlement", {
    p_book_id: bookId,
    p_email: parsed.value.email,
    p_note: parsed.value.note,
  });
  if (error?.code === "P0002") return { error: l.errors.userNotFound };
  if (error?.code === "23505") return { error: l.errors.alreadyGranted };
  if (error) return { error: e.generic };
  return { message: l.granted };
}

/** Retire un droit de lecture (conservé, daté, pour l'historique). */
export async function revokeEntitlement(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_entitlement", { p_entitlement_id: id });
  if (error) return { error: e.generic };
  return { message: l.revoked };
}
