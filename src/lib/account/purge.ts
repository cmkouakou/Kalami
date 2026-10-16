/**
 * =============================================================
 *  Fichier    : purge.ts (lib/account)
 *  Projet     : Kalami
 *  Description: Exécution des suppressions de compte arrivées à échéance (30 jours après la
 *               demande) : fichiers du stockage (pièces jointes des études possédées, PDF
 *               filigranés), puis compte Auth. Les lignes suivent par cascade (études,
 *               classes, annotations…) ; fiche auteur et registre sont détachés (set null).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/admin.ts, lib/strategy/attachments.ts
 * =============================================================
 */

import "server-only";

import { ATTACHMENTS_BUCKET } from "@/lib/strategy/attachments";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Comptes traités par exécution (tâche quotidienne). */
const PURGE_BATCH = 20;
const PDF_EXPORTS_BUCKET = "pdf-exports";

/**
 * Retire des fichiers d'un seau (sans effet si la liste est vide).
 * @param db     - Client admin
 * @param bucket - Nom du seau
 * @param paths  - Chemins des fichiers
 */
async function removeFiles(db: AdminClient, bucket: string, paths: string[]) {
  if (!paths.length) return;
  const { error } = await db.storage.from(bucket).remove(paths);
  if (error) throw new Error(`Suppression des fichiers (${bucket}) : ${error.message}`);
}

/**
 * Supprime un compte : fichiers d'abord (aucune cascade dans le stockage), puis l'utilisateur.
 * @param db     - Client admin
 * @param userId - Compte à supprimer
 */
async function deleteAccount(db: AdminClient, userId: string) {
  const { data: studies, error: studiesError } = await db
    .from("studies")
    .select("id")
    .eq("owner_id", userId);
  if (studiesError) throw new Error(`Lecture des études : ${studiesError.message}`);

  const studyIds = (studies ?? []).map((study) => study.id as string);
  if (studyIds.length) {
    const { data: files, error } = await db
      .from("study_attachments")
      .select("storage_path")
      .in("study_id", studyIds);
    if (error) throw new Error(`Lecture des pièces jointes : ${error.message}`);
    await removeFiles(db, ATTACHMENTS_BUCKET, (files ?? []).map((f) => f.storage_path));
  }

  const { data: exports, error: exportsError } = await db
    .from("pdf_exports")
    .select("storage_path")
    .eq("user_id", userId);
  if (exportsError) throw new Error(`Lecture des PDF : ${exportsError.message}`);
  await removeFiles(db, PDF_EXPORTS_BUCKET, (exports ?? []).map((e) => e.storage_path));

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Suppression du compte : ${error.message}`);

  // Trace sans renseignement personnel : l'identifiant ne désigne plus personne
  await db.from("audit_logs").insert({
    action: "account.deleted",
    target_type: "user",
    target_id: userId,
    details: { studies: studyIds.length },
  });
}

/**
 * Exécute les demandes arrivées à échéance ; un échec n'empêche pas les suivantes.
 * @returns Nombre de comptes supprimés et d'échecs (réessayés le lendemain)
 */
export async function purgeDueAccounts(): Promise<{ deleted: number; failed: number }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("account_deletion_requests")
    .select("user_id")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(PURGE_BATCH);
  if (error) throw new Error(`Lecture des demandes de suppression : ${error.message}`);

  let deleted = 0;
  let failed = 0;
  for (const { user_id: userId } of data ?? []) {
    try {
      await deleteAccount(db, userId as string);
      deleted += 1;
    } catch (cause) {
      failed += 1;
      console.error("Suppression de compte en échec", userId, cause);
    }
  }
  return { deleted, failed };
}
