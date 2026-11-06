/**
 * =============================================================
 *  Fichier    : actions.ts (guide)
 *  Projet     : Kalami Données
 *  Description: Action serveur qui coche ou décoche une case du chantier pour
 *               l'utilisateur connecté. Seuls les identifiants connus du chantier sont
 *               acceptés ; la RLS limite l'écriture aux lignes du lecteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, guide/sprints.ts
 * =============================================================
 */

"use server";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { TOUTES_LES_CASES } from "./sprints";

/** Code PostgreSQL d'une clé primaire déjà présente (case déjà cochée). */
const DEJA_PRESENTE = "23505";

/**
 * Coche ou décoche une case.
 * @param id    - Identifiant de la case (ex. « c2-3 »)
 * @param coche - true pour cocher, false pour décocher
 * @returns ok: false si non connecté, identifiant inconnu ou écriture refusée
 */
export async function basculerCase(id: string, coche: boolean): Promise<{ ok: boolean }> {
  if (typeof id !== "string" || !TOUTES_LES_CASES.has(id) || typeof coche !== "boolean") {
    return { ok: false };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  // Kalami Données est réservé aux administrateurs (v0.21.1)
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) return { ok: false };

  const supabase = await createClient();
  if (coche) {
    const { error } = await supabase
      .from("powerbi_guide_progress")
      .insert({ user_id: user.id, item_id: id });
    return { ok: !error || error.code === DEJA_PRESENTE };
  }

  const { error } = await supabase
    .from("powerbi_guide_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", id);
  return { ok: !error };
}
