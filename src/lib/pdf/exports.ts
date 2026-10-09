/**
 * =============================================================
 *  Fichier    : exports.ts
 *  Projet     : Kalami
 *  Description: Service des PDF filigranés (clé secrète, serveur uniquement) : état du
 *               droit PDF d'un lecteur, préparation d'un fichier (un seul fichier actif,
 *               valable 24 h), consommation atomique d'un téléchargement suivie d'un lien
 *               signé de 60 s, et suppression des fichiers expirés.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: lib/supabase/admin.ts, generate.ts, i18n
 * =============================================================
 */

import "server-only";

import { getDictionary } from "@/i18n";
import type { CurrentUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

import { generateWatermarkedPdf } from "./generate";
import type { PdfChapter } from "./render";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Seau privé des fichiers générés. */
const BUCKET = "pdf-exports";

/** Durée de vie d'un fichier généré. */
export const PDF_EXPORT_TTL_HOURS = 24;

/** Durée de validité du lien signé remis au navigateur. */
const SIGNED_URL_SECONDS = 60;

/** Nombre maximal de fichiers expirés supprimés par passage. */
const CLEANUP_BATCH = 100;

// ==================== TYPES ====================

export type PdfPurchaseState = {
  id: string;
  reference: string;
  downloads_remaining: number;
};

/** Fichier prêt à télécharger. */
export type PdfExportInfo = { id: string; expires_at: string };

/** État affiché sur la fiche du livre. */
export type PdfStatus = {
  purchase: PdfPurchaseState;
  export: PdfExportInfo | null;
};

/** Erreurs métier renvoyées aux routes. */
export type PdfErrorCode =
  | "no_purchase"
  | "exhausted"
  | "unavailable"
  | "expired"
  | "revoked"
  | "not_found";

/** Statut HTTP renvoyé par les routes pour chaque refus. */
export const PDF_ERROR_STATUS: Record<PdfErrorCode, 403 | 404 | 410> = {
  no_purchase: 403,
  exhausted: 403,
  revoked: 403,
  unavailable: 404,
  not_found: 404,
  expired: 410,
};

export type PrepareResult =
  | { ok: true; export: PdfExportInfo; remaining: number }
  | { ok: false; code: PdfErrorCode };

export type DownloadResult = { ok: true; url: string } | { ok: false; code: PdfErrorCode };

type BookRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  language: string;
  status: string;
  current_version_id: string | null;
  author: { display_name: string };
};

// ==================== LECTURES ====================

/** Droit PDF actif du lecteur sur le livre, ou null. */
async function findPurchase(
  db: AdminClient,
  userId: string,
  bookId: string,
): Promise<PdfPurchaseState | null> {
  const { data, error } = await db
    .from("pdf_purchases")
    .select("id, reference, downloads_remaining")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .is("revoked_at", null)
    .maybeSingle<PdfPurchaseState>();
  if (error) throw new Error(`Lecture du droit PDF impossible : ${error.message}`);
  return data;
}

/** Fichier encore valable du droit PDF, ou null. */
async function findActiveExport(
  db: AdminClient,
  purchaseId: string,
): Promise<PdfExportInfo | null> {
  const { data, error } = await db
    .from("pdf_exports")
    .select("id, expires_at")
    .eq("purchase_id", purchaseId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PdfExportInfo>();
  if (error) throw new Error(`Lecture des fichiers PDF impossible : ${error.message}`);
  return data;
}

/**
 * État du droit PDF d'un lecteur sur un livre (fiche du livre).
 * @returns null si le lecteur n'a pas l'option PDF
 */
export async function getPdfStatus(userId: string, bookId: string): Promise<PdfStatus | null> {
  const db = createAdminClient();
  const purchase = await findPurchase(db, userId, bookId);
  if (!purchase) return null;
  return { purchase, export: await findActiveExport(db, purchase.id) };
}

/** Livre publié et ses chapitres courants, ou null si indisponible. */
async function loadPrintableBook(
  db: AdminClient,
  bookId: string,
): Promise<{ book: BookRow; chapters: PdfChapter[] } | null> {
  const { data: book, error } = await db
    .from("books")
    .select(
      "id, slug, title, subtitle, language, status, current_version_id, " +
        "author:authors!inner(display_name)",
    )
    .eq("id", bookId)
    .maybeSingle<BookRow>();
  if (error) throw new Error(`Lecture du livre impossible : ${error.message}`);
  if (!book || book.status !== "published" || !book.current_version_id) return null;

  const { data: chapters, error: chaptersError } = await db
    .from("chapters")
    .select("position, title, blocks")
    .eq("version_id", book.current_version_id)
    .order("position");
  if (chaptersError) throw new Error(`Lecture des chapitres impossible : ${chaptersError.message}`);
  if (!chapters?.length) return null;
  return { book, chapters: chapters as PdfChapter[] };
}

/** Nom imprimé : nom du profil, sinon le courriel. */
async function buyerName(db: AdminClient, user: CurrentUser): Promise<string> {
  const { data } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle<{ display_name: string | null }>();
  return data?.display_name?.trim() || user.email || "";
}

// ==================== NETTOYAGE ====================

/**
 * Supprime des fichiers (seau puis lignes).
 * @param rows - Fichiers à supprimer
 */
async function removeExports(db: AdminClient, rows: { id: string; storage_path: string }[]) {
  if (!rows.length) return;
  const { error } = await db.storage.from(BUCKET).remove(rows.map((row) => row.storage_path));
  if (error) throw new Error(`Suppression des fichiers PDF impossible : ${error.message}`);
  await db.from("pdf_exports").delete().in("id", rows.map((row) => row.id));
}

/**
 * Supprime les fichiers expirés (tâche quotidienne et à chaque préparation).
 * @returns Nombre de fichiers supprimés
 */
export async function purgeExpiredExports(): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("pdf_exports")
    .select("id, storage_path")
    .lte("expires_at", new Date().toISOString())
    .limit(CLEANUP_BATCH);
  if (error) throw new Error(`Lecture des fichiers expirés impossible : ${error.message}`);
  await removeExports(db, data ?? []);
  return data?.length ?? 0;
}

// ==================== PRÉPARATION ====================

/**
 * Prépare le PDF filigrané du lecteur : renvoie le fichier encore valable s'il existe,
 * sinon en génère un nouveau (valable 24 h) et supprime les anciens.
 * @param user   - Lecteur connecté (son courriel est imprimé sur chaque page)
 * @param bookId - Identifiant du livre
 */
export async function preparePdfExport(user: CurrentUser, bookId: string): Promise<PrepareResult> {
  const db = createAdminClient();
  const purchase = await findPurchase(db, user.id, bookId);
  if (!purchase) return { ok: false, code: "no_purchase" };
  if (purchase.downloads_remaining <= 0) return { ok: false, code: "exhausted" };

  const remaining = purchase.downloads_remaining;
  const active = await findActiveExport(db, purchase.id);
  if (active) return { ok: true, export: active, remaining };

  const printable = await loadPrintableBook(db, bookId);
  if (!printable || !user.email) return { ok: false, code: "unavailable" };
  const { book, chapters } = printable;

  const p = getDictionary().pdf;
  const bytes = await generateWatermarkedPdf(
    {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author.display_name,
      language: book.language,
      chapters,
    },
    { name: await buyerName(db, user), email: user.email, reference: purchase.reference },
    { copyOf: p.copyOf, contents: p.contents, by: p.by },
  );

  const exportId = crypto.randomUUID();
  const storagePath = `${user.id}/${exportId}.pdf`;
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new Error(`Envoi du PDF impossible : ${uploadError.message}`);

  const expiresAt = new Date(Date.now() + PDF_EXPORT_TTL_HOURS * 3600 * 1000).toISOString();
  const { error: insertError } = await db.from("pdf_exports").insert({
    id: exportId,
    purchase_id: purchase.id,
    user_id: user.id,
    book_id: bookId,
    version_id: book.current_version_id,
    storage_path: storagePath,
    size_bytes: bytes.byteLength,
    expires_at: expiresAt,
  });
  if (insertError) {
    await db.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Enregistrement du PDF impossible : ${insertError.message}`);
  }

  // Un seul fichier par droit : les précédents (expirés) sont supprimés
  const { data: previous } = await db
    .from("pdf_exports")
    .select("id, storage_path")
    .eq("purchase_id", purchase.id)
    .neq("id", exportId);
  await removeExports(db, previous ?? []);
  await purgeExpiredExports();

  return { ok: true, export: { id: exportId, expires_at: expiresAt }, remaining };
}

// ==================== TÉLÉCHARGEMENT ====================

/** Codes levés par consume_pdf_download. */
const CONSUME_ERRORS: PdfErrorCode[] = ["not_found", "expired", "revoked", "exhausted"];

/**
 * Consomme un téléchargement et renvoie un lien signé de 60 s vers le fichier.
 * @param userId   - Lecteur connecté (doit être le propriétaire du fichier)
 * @param exportId - Identifiant du fichier
 */
export async function consumePdfDownload(
  userId: string,
  exportId: string,
): Promise<DownloadResult> {
  const db = createAdminClient();
  const { data: storagePath, error } = await db.rpc("consume_pdf_download", {
    p_export_id: exportId,
    p_user_id: userId,
  });
  if (error) {
    const code = CONSUME_ERRORS.find((known) => known === error.message);
    if (code) return { ok: false, code };
    throw new Error(`Téléchargement du PDF impossible : ${error.message}`);
  }

  const { data: row } = await db
    .from("pdf_exports")
    .select("book:books!inner(slug), purchase:pdf_purchases!inner(reference)")
    .eq("id", exportId)
    .maybeSingle<{ book: { slug: string }; purchase: { reference: string } }>();
  const fileName = row ? `${row.book.slug}-${row.purchase.reference}.pdf` : true;

  const { data: signed, error: signError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(String(storagePath), SIGNED_URL_SECONDS, { download: fileName });
  if (signError || !signed) {
    throw new Error(`Lien de téléchargement impossible : ${signError?.message ?? "vide"}`);
  }
  return { ok: true, url: signed.signedUrl };
}
