/**
 * =============================================================
 *  Fichier    : eac-queries.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lecture, avec la session du membre (RLS), du dossier Entrepreneur au
 *               Combat lié à une étude (v0.26.0) : numéro du dossier et contexte transmis.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-17
 *  Dépendances: lib/supabase/server.ts, lib/strategy/eac.ts
 * =============================================================
 */

import "server-only";

import { isUuid } from "@/lib/admin/validation";
import { readEacContext, type EacContext } from "@/lib/strategy/eac";
import { createClient } from "@/lib/supabase/server";

/** Dossier EAC lié à une étude. */
export type EacLink = { reference: string; context: EacContext };

/**
 * Dossier EAC lié à l'étude ; null pour une étude ordinaire ou un contexte illisible.
 * @param studyId - Identifiant de l'étude
 */
export async function getEacLink(studyId: string): Promise<EacLink | null> {
  if (!isUuid(studyId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_external_links")
    .select("external_ref, context")
    .eq("study_id", studyId)
    .maybeSingle();
  if (error) throw new Error(`Lecture du dossier EAC impossible : ${error.message}`);
  if (!data) return null;
  const context = readEacContext(data.context);
  return context ? { reference: data.external_ref, context } : null;
}
