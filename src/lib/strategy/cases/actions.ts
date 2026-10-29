/**
 * =============================================================
 *  Fichier    : actions.ts (cases)
 *  Projet     : Kalami Stratégie
 *  Description: Ouverture de l'étude préremplie d'un cas d'entraînement : le serveur envoie
 *               le nom, la question et le profil du cas ; la base vérifie l'accès, crée
 *               l'étude sans crédit (ou renvoie celle déjà ouverte). Étude résolue
 *               (corrigé des étapes 1 à 8, plan à générer) en v0.14.3.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-24
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, cases/registry.ts
 * =============================================================
 */

"use server";

import { redirect } from "next/navigation";

import type { FormState } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/dal";
import type { StepNo } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

import { getPracticeCase } from "./registry";
import { getStrategyDictionary } from "@/i18n/strategy";

const s = getStrategyDictionary();

/** Étapes préremplies dans l'étude résolue. */
const EXAMPLE_STEPS: StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8];

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

/**
 * Ouvre (ou retrouve) l'étude résolue du cas : corrigé de l'auteur aux étapes 1 à 8,
 * validées, plan à générer par l'acheteur. Elle ne déverrouille aucun corrigé.
 * @param code - Code du cas, lié par .bind
 *
 * Erreurs possibles :
 *   - no_access : le compte n'a pas (ou plus) accès au cas
 */
export async function startPracticeCaseExample(code: string): Promise<FormState> {
  await requireUser(`/strategie/cas/${code}`);
  const practiceCase = getPracticeCase(code);
  if (!practiceCase) return { error: s.errors.generic };

  // Le plan (9) n'est pas envoyé : l'acheteur le génère lui-même
  const steps = Object.fromEntries(
    EXAMPLE_STEPS.map((step) => [String(step), practiceCase.corrections[step]]),
  );
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("practice_case_start_example", {
    p_code: practiceCase.code,
    p_company_name: practiceCase.companyName,
    p_strategic_question: practiceCase.strategicQuestion,
    p_profile: practiceCase.profile,
    p_steps: steps,
  });
  if (error || typeof data !== "string") {
    return { error: error?.message === "no_access" ? s.errors.no_access : s.errors.generic };
  }
  redirect(`/strategie/etudes/${data}`);
}
