/**
 * =============================================================
 *  Fichier    : plan-inputs.ts
 *  Projet     : Kalami Stratégie
 *  Description: Lecture serveur de la matière du plan stratégique (S8a) : nom, question et
 *               profil de l'étude, puis contenu relu des étapes 5 à 8. Lecture avec la
 *               session de l'utilisateur, donc soumise aux règles RLS.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/supabase/server.ts, lib/strategy/queries.ts, plan-assemble.ts, gabarits
 * =============================================================
 */

import "server-only";

import type { PlanInputs } from "@/lib/strategy/plan-assemble";
import { readProfileData } from "@/lib/strategy/profile";
import { getSourcePayloads } from "@/lib/strategy/queries";
import { readAction } from "@/lib/strategy/templates/action";
import { readChoice } from "@/lib/strategy/templates/choice";
import { readDirection } from "@/lib/strategy/templates/direction";
import { readSynthesis } from "@/lib/strategy/templates/synthesis";
import { createClient } from "@/lib/supabase/server";

type StudyRow = {
  company_name: string;
  strategic_question: string;
  company_profiles: { data: unknown } | null;
};

/**
 * Lit la matière du plan d'une étude.
 * @param studyId - Identifiant de l'étude (UUID déjà vérifié)
 * @returns Matière du plan, ou null si l'utilisateur n'a pas accès à l'étude
 */
export async function getPlanInputs(studyId: string): Promise<PlanInputs | null> {
  const supabase = await createClient();
  const { data: study } = await supabase
    .from("studies")
    .select("company_name, strategic_question, company_profiles (data)")
    .eq("id", studyId)
    .maybeSingle<StudyRow>();
  if (!study) return null;

  const raw = await getSourcePayloads(studyId, [5, 6, 7, 8]);
  return {
    companyName: study.company_name,
    question: study.strategic_question,
    profile: readProfileData(study.company_profiles?.data),
    synthesis: readSynthesis(raw[5]),
    direction: readDirection(raw[6]),
    choice: readChoice(raw[7]),
    action: readAction(raw[8]),
  };
}
