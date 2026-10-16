/**
 * =============================================================
 *  Fichier    : admin-queries.ts (lib/legal)
 *  Projet     : Kalami
 *  Description: Compteurs de confidentialité pour l'administration : choix enregistrés au
 *               registre des consentements, suppressions de compte en attente.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PrivacyCounters = { accepted: number; refused: number; pendingDeletions: number };

/**
 * Compte les consentements et les demandes de suppression (RLS : administrateur aal2).
 * @returns Compteurs ; lève une erreur si une lecture échoue
 */
export async function getPrivacyCounters(): Promise<PrivacyCounters> {
  const supabase = await createClient();
  const count = { count: "exact", head: true } as const;
  const [accepted, refused, deletions] = await Promise.all([
    supabase.from("consent_records").select("id", count).eq("choice", "accepted"),
    supabase.from("consent_records").select("id", count).eq("choice", "refused"),
    supabase.from("account_deletion_requests").select("user_id", count),
  ]);
  for (const result of [accepted, refused, deletions]) {
    if (result.error) throw new Error(`Compteurs de confidentialité : ${result.error.message}`);
  }
  return {
    accepted: accepted.count ?? 0,
    refused: refused.count ?? 0,
    pendingDeletions: deletions.count ?? 0,
  };
}
