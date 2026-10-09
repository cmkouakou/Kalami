/**
 * =============================================================
 *  Fichier    : content-actions.ts
 *  Projet     : Kalami
 *  Description: Actions serveur d'administration du contenu d'un livre : conversion d'un
 *               manuscrit déposé (DOCX/EPUB), règles de l'extrait gratuit, octroi et retrait
 *               des droits de lecture et des options PDF. Toute fonction exportée est une
 *               action publique : arguments vérifiés, session administrateur (aal2) exigée.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-08
 *  Dépendances: lib/content/*, lib/admin/validation.ts, lib/admin/audit.ts, supabase
 * =============================================================
 */

"use server";

import { updateTag } from "next/cache";

import { getDictionary } from "@/i18n";
import { audit } from "@/lib/admin/audit";
import { isUuid, parseGrant, parsePreviewRule } from "@/lib/admin/validation";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import type { TocEntry } from "@/lib/catalog/types";
import { convertStoredManuscript } from "@/lib/content/manuscript";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const l = t.admin.content;
const e = t.admin.errors;

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

  // La fonction SQL écrit elle-même l'entrée d'audit « book.version_created »
  const supabase = await createClient();
  const result = await convertStoredManuscript(
    supabase, bookId, path, "admin_save_book_version",
  );
  if (result.message) updateTag(CATALOG_TAG);
  return { error: result.error, message: result.message };
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

// ==================== OPTION PDF ====================

/** Accorde l'option PDF (3 téléchargements) et, au besoin, le droit de lecture. */
export async function grantPdf(
  bookId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(bookId)) return { error: e.generic };
  const parsed = parseGrant(formData);
  if (!parsed.ok) return { error: parsed.error };

  // La fonction SQL vérifie le rôle et l'option du livre, puis écrit l'entrée d'audit
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_pdf", {
    p_book_id: bookId,
    p_email: parsed.value.email,
    p_note: parsed.value.note,
  });
  if (error?.code === "P0002") return { error: l.errors.userNotFound };
  if (error?.code === "23505") return { error: l.pdf.alreadyGranted };
  if (error?.message === "pdf_disabled") return { error: l.pdf.pdfDisabled };
  if (error) return { error: e.generic };
  return { message: l.pdf.granted };
}

/** Retire une option PDF (conservée, datée) ; le droit de lecture n'est pas touché. */
export async function revokePdf(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_pdf", { p_purchase_id: id });
  if (error) return { error: e.generic };
  return { message: l.pdf.revoked };
}

/** Remet 3 téléchargements à une option PDF active. */
export async function resetPdfDownloads(id: string): Promise<FormState> {
  await requireAdmin();
  if (!isUuid(id)) return { error: e.generic };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_reset_pdf_downloads", { p_purchase_id: id });
  if (error) return { error: e.generic };
  return { message: l.pdf.resetDone };
}
