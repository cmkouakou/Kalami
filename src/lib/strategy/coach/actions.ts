/**
 * =============================================================
 *  Fichier    : actions.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur du coach pour les membres d'une étude : demander une
 *               relecture du gabarit enregistré, noter la décision prise sur une suggestion
 *               (acceptée, modifiée, rejetée). Rôle, débit et plafond sont vérifiés en SQL.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: coach/run.ts, coach/queries.ts, lib/auth/dal.ts, lib/supabase/server.ts
 * =============================================================
 */

"use server";

import { getDictionary } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import { getCoachUsage, type CoachDecision, type CoachUsage } from "@/lib/strategy/coach/queries";
import { runReview } from "@/lib/strategy/coach/run";
import type { Review } from "@/lib/strategy/coach/schemas";
import { hasTemplate } from "@/lib/strategy/templates";
import { createClient } from "@/lib/supabase/server";

const c = getDictionary().strategy.coach;

// ==================== TYPES ====================

export type ReviewResult =
  | { ok: true; requestId: string; review: Review; usage: CoachUsage | null }
  | { ok: false; error: string; usage: CoachUsage | null };

// ==================== RELECTURE ====================

/**
 * Demande au coach de relire le gabarit enregistré d'une étape.
 * @param studyId - Identifiant de l'étude
 * @param stepNo  - Étape dotée d'un gabarit
 * @returns Relecture et consommation à jour, ou message d'erreur
 */
export async function requestReview(studyId: string, stepNo: number): Promise<ReviewResult> {
  await requireUser(`/strategie/etudes/${studyId}`);
  if (!isUuid(studyId) || !hasTemplate(stepNo)) {
    return { ok: false, error: c.errors.failed, usage: null };
  }

  const result = await runReview(studyId, stepNo);
  const usage = await getCoachUsage(studyId).catch(() => null);
  if (!result.ok) return { ok: false, error: c.errors[result.error], usage };
  return { ok: true, requestId: result.requestId, review: result.review, usage };
}

// ==================== DÉCISIONS ====================

/**
 * Note la décision prise sur une suggestion (suivi de l'usage du coach).
 * @param requestId - Relecture concernée
 * @param index     - Indice de la suggestion
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
