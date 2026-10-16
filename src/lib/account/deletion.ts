/**
 * =============================================================
 *  Fichier    : deletion.ts (lib/account)
 *  Projet     : Kalami
 *  Description: Lecture de l'état de suppression du compte : demande en cours et ce que
 *               la suppression emportera (études possédées, partagées, classes, fiche auteur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-16
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DeletionImpact = {
  ownedStudies: number;
  sharedStudies: number;
  classes: number;
  isAuthor: boolean;
};

export type DeletionState = {
  /** Date prévue de la suppression, ou null si aucune demande en cours. */
  scheduledFor: string | null;
  impact: DeletionImpact;
};

/** Convertit une valeur jsonb en entier positif (0 par défaut). */
function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 ? count : 0;
}

/**
 * Lit la demande de suppression et son impact pour l'utilisateur connecté.
 * @param userId - Identifiant de l'utilisateur (RLS : sa propre demande seulement)
 * @returns État de suppression ; lève une erreur si une lecture échoue
 */
export async function getDeletionState(userId: string): Promise<DeletionState> {
  const supabase = await createClient();
  const [request, impact] = await Promise.all([
    supabase
      .from("account_deletion_requests")
      .select("scheduled_for")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.rpc("account_deletion_impact"),
  ]);
  if (request.error) throw new Error(`Demande de suppression : ${request.error.message}`);
  if (impact.error) throw new Error(`Impact de la suppression : ${impact.error.message}`);

  const raw = (impact.data ?? {}) as Record<string, unknown>;
  return {
    scheduledFor: request.data?.scheduled_for ?? null,
    impact: {
      ownedStudies: toCount(raw.owned_studies),
      sharedStudies: toCount(raw.shared_studies),
      classes: toCount(raw.classes),
      isAuthor: raw.is_author === true,
    },
  };
}
