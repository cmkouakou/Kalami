/**
 * =============================================================
 *  Fichier    : actions.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur du coach pour les membres d'une étude : demander une
 *               relecture, des questions d'approfondissement, une évaluation du gabarit
 *               enregistré ou une recherche Web sourcée (étapes 1 et 2), noter la décision
 *               prise sur une suggestion (acceptée, modifiée, rejetée), une question (traitée,
 *               écartée) ou un fait trouvé (ajouté, écarté). Rôle, débit et plafond sont
 *               vérifiés en SQL. Décisions groupées sur les propositions de synthèse (S6b).
 *               Rédaction d'une section du plan stratégique (étape 9, S8a).
 *               Forfait absent ou épuisé : « pay » renvoie vers la page du coach (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-16
 *  Dépendances: coach/run.ts, coach/plan.ts, coach/queries.ts, lib/auth/dal.ts,
 *               lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import {
  COACH_FUNCTIONS,
  isFunctionAvailable,
  needsPack,
  type CoachFunction,
} from "@/lib/strategy/coach/context";
import { getCoachUsage, type CoachDecision, type CoachUsage } from "@/lib/strategy/coach/queries";
import type { PlanProposal } from "@/lib/strategy/coach/plan-output";
import { runPlanCoach } from "@/lib/strategy/coach/plan";
import { runCoach, type CoachOutputs } from "@/lib/strategy/coach/run";
import { PLAN_STEP } from "@/lib/strategy/steps";
import { hasTemplate } from "@/lib/strategy/templates";
import { PLAN_SECTIONS, type PlanSectionKey } from "@/lib/strategy/templates/plan";
import { createClient } from "@/lib/supabase/server";

const c = getDictionary().strategy.coach;

// ==================== TYPES ====================

export type CoachActionResult<F extends CoachFunction> =
  | { ok: true; requestId: string; output: CoachOutputs[F]; usage: CoachUsage | null }
  | { ok: false; error: string; usage: CoachUsage | null; pay?: boolean };

// ==================== DEMANDES ====================

/**
 * Demande au coach une relecture, des questions, une évaluation ou une recherche Web.
 * @param fn      - review, deepen, score, research (étapes 1 et 2 seulement) ou synthesize
 *                  (étape 5 seulement)
 * @param studyId - Identifiant de l'étude
 * @param stepNo  - Étape dotée d'un gabarit
 * @returns Résultat et consommation à jour, ou message d'erreur
 */
export async function requestCoach<F extends CoachFunction>(
  fn: F,
  studyId: string,
  stepNo: number,
): Promise<CoachActionResult<F>> {
  await requireUser(`/strategie/etudes/${studyId}`);
  if (!COACH_FUNCTIONS.includes(fn) || !isUuid(studyId) || !hasTemplate(stepNo)
    || !isFunctionAvailable(fn, stepNo)) {
    return { ok: false, error: c.errors.failed, usage: null };
  }

  const result = await runCoach(fn, studyId, stepNo);
  const usage = await getCoachUsage(studyId).catch(() => null);
  if (!result.ok) {
    return { ok: false, error: c.errors[result.error], usage, pay: needsPack(result.error) };
  }
  return { ok: true, requestId: result.requestId, output: result.output, usage };
}

/** Résultat d'une demande de rédaction d'une section du plan. */
export type PlanActionResult =
  | { ok: true; requestId: string; output: PlanProposal; usage: CoachUsage | null }
  | { ok: false; error: string; usage: CoachUsage | null; pay?: boolean };

/**
 * Demande au coach de rédiger une section du plan stratégique (proposition seulement).
 * @param studyId - Identifiant de l'étude
 * @param section - Clé de la section (situation, issues…)
 * @returns Proposition et consommation à jour, ou message d'erreur
 */
export async function requestPlanSection(
  studyId: string,
  section: string,
): Promise<PlanActionResult> {
  await requireUser(`/strategie/etudes/${studyId}/etapes/${PLAN_STEP}`);
  if (!isUuid(studyId) || !(PLAN_SECTIONS as readonly string[]).includes(section)) {
    return { ok: false, error: c.errors.failed, usage: null };
  }

  const result = await runPlanCoach(studyId, section as PlanSectionKey);
  const usage = await getCoachUsage(studyId).catch(() => null);
  if (!result.ok) {
    return { ok: false, error: c.errors[result.error], usage, pay: needsPack(result.error) };
  }
  return { ok: true, requestId: result.requestId, output: result.output, usage };
}

// ==================== DÉCISIONS ====================

/**
 * Note la décision prise sur une suggestion, une question ou un fait (suivi du coach).
 * Question : accepted = traitée, rejected = écartée. Fait : accepted = ajouté, rejected = écarté.
 * @param requestId - Demande concernée
 * @param index     - Indice de la suggestion ou de la question
 * @param decision  - accepted, modified ou rejected
 */
export async function decideSuggestion(
  requestId: string,
  index: number,
  decision: CoachDecision,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser("/strategie");
  if (!isUuid(requestId) || !Number.isInteger(index) || index < 0
    || !["accepted", "modified", "rejected"].includes(decision)) {
    return { ok: false, error: c.errors.failed };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("coach_decide", {
    p_request_id: requestId,
    p_index: index,
    p_decision: decision,
  });
  if (error) {
    return { ok: false, error: error.code === "42501" ? c.errors.forbidden : c.errors.failed };
  }
  return { ok: true };
}

/** Plus grand nombre de décisions notées en une fois (borne de coach_decide_many). */
const MAX_DECISIONS = 50;

/**
 * Note en une fois les décisions prises sur les propositions de synthèse (cochées = ajoutées,
 * décochées = écartées).
 * @param requestId - Demande concernée
 * @param decisions - Décision par indice de proposition
 */
export async function decideMany(
  requestId: string,
  decisions: Record<number, CoachDecision>,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser("/strategie");
  const entries = Object.entries(decisions);
  const valid = entries.every(([index, decision]) => {
    const n = Number(index);
    return Number.isInteger(n) && n >= 0 && n < MAX_DECISIONS
      && ["accepted", "modified", "rejected"].includes(decision);
  });
  if (!isUuid(requestId) || entries.length === 0 || entries.length > MAX_DECISIONS || !valid) {
    return { ok: false, error: c.errors.failed };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("coach_decide_many", {
    p_request_id: requestId,
    p_decisions: decisions,
  });
  if (error) {
    return { ok: false, error: error.code === "42501" ? c.errors.forbidden : c.errors.failed };
  }
  return { ok: true };
}
