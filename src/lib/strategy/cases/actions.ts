/**
 * =============================================================
 *  Fichier    : actions.ts (cases)
 *  Projet     : Kalami Stratégie
 *  Description: Ouverture de l'étude préremplie d'un cas d'entraînement : le serveur envoie
 *               le nom, la question et le profil du cas ; la base vérifie l'accès, crée
 *               l'étude sans crédit (ou renvoie celle déjà ouverte).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, cases/registry.ts
 * =============================================================
 */

"use server";

import { redirect } from "next/navigation";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { getPracticeCase } from "./registry";

const s = getDictionary().strategy;

/**
 * Ouvre (ou retrouve) l'étude préremplie du cas, puis y conduit l'acheteur.
 * @param code - Code du cas, lié par .bind
 *
 * Erreurs possibles :
 *   - no_access : le compte n'a pas (ou plus) accès au cas
 */
export async function startPracticeCase(code: string): Promise<FormState> {
  await requireUser(`/strategie/cas/${code}`);
  const practiceCase = getPracticeCase(code);
  if (!practiceCase) return { error: s.errors.generic };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("practice_case_start", {
    p_code: practiceCase.code,
    p_company_name: practiceCase.companyName,
    p_strategic_question: practiceCase.strategicQuestion,
    p_profile: practiceCase.profile,
  });
  if (error || typeof data !== "string") {
    return { error: error?.message === "no_access" ? s.errors.no_access : s.errors.generic };
  }
  redirect(`/strategie/etudes/${data}`);
}
