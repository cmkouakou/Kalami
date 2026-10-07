/**
 * =============================================================
 *  Fichier    : audit.ts
 *  Projet     : Kalami
 *  Description: Écriture dans le journal d'audit depuis les actions d'administration.
 *               Module serveur ordinaire (et non « use server ») : il ne doit pas devenir
 *               une action appelable depuis le navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-08
 *  Dépendances: lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import type { createClient } from "@/lib/supabase/server";

/** Client Supabase de la session administrateur. */
export type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Inscrit l'opération au journal d'audit (fonction SQL réservée aux administrateurs).
 * Une erreur ici signale une anomalie grave (droits) : elle est levée, pas masquée.
 */
export async function audit(
  supabase: Supabase,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.rpc("write_audit", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_details: details,
  });
  if (error) throw new Error(`Journal d'audit impossible : ${error.message}`);
}
