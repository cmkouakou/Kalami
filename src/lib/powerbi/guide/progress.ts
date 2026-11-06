/**
 * =============================================================
 *  Fichier    : progress.ts (guide)
 *  Projet     : Kalami Données
 *  Description: Lecture des cases cochées du chantier pour l'utilisateur connecté. Si la
 *               table n'existe pas encore (migration non appliquée) ou si la lecture
 *               échoue, la page s'affiche quand même, cases vides et non enregistrables.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/supabase/server.ts, migration 20261121120000_powerbi_guide_progress
 * =============================================================
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Cases cochées, et si l'enregistrement est possible. */
export type ProgressionChantier = { coches: string[]; enregistrable: boolean };

/** Retourne les cases cochées de l'utilisateur connecté (la RLS limite à ses lignes). */
export async function getProgressionChantier(): Promise<ProgressionChantier> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("powerbi_guide_progress")
    .select("item_id")
    .returns<{ item_id: string }[]>();

  if (error || !data) return { coches: [], enregistrable: false };
  return { coches: data.map((ligne) => ligne.item_id), enregistrable: true };
}
