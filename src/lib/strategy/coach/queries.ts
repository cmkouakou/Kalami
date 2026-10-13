/**
 * =============================================================
 *  Fichier    : queries.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Lectures du coach avec la session de l'utilisateur (membres de l'étude
 *               seulement) : consommation de l'étude par rapport à son plafond et dernière
 *               relecture réussie d'une étape, avec les décisions déjà prises.
 *               Lectures de l'administrateur : réglages et consommation par étude.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: lib/supabase/server.ts, coach/schemas.ts, coach/client.ts
 * =============================================================
 */

import "server-only";

import { isCoachConfigured } from "@/lib/strategy/coach/client";
import { readReview, type Review } from "@/lib/strategy/coach/schemas";
import type { StepNo } from "@/lib/strategy/steps";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type CoachDecision = "accepted" | "modified" | "rejected";

/** Consommation d'une étude (dollars US). */
export type CoachUsage = { spent: number; budget: number; enabled: boolean };

/** Dernière relecture affichée dans le panneau. */
export type CoachReview = {
  requestId: string;
  review: Review;
  /** Décision par indice de suggestion. */
  decisions: Record<number, CoachDecision>;
  /** Révision du gabarit relue (pour signaler une relecture dépassée). */
  revision: number;
  createdAt: string;
};

/** Titre d'une erreur classique, pour nommer la règle d'une suggestion. */
export type CoachRuleTitle = { code: string; title: string };

/** État du coach transmis au gabarit par la page. */
export type CoachState = {
  usage: CoachUsage;
  latest: CoachReview | null;
  rules: CoachRuleTitle[];
};

export type CoachSettings = {
  enabled: boolean;
  model: string;
  inputPrice: number;
  outputPrice: number;
  budget: number;
  rateLimit: number;
  rateWindow: number;
};

export type CoachUsageRow = {
  study_id: string;
  company_name: string;
  owner_email: string | null;
  requests: number;
  spent: number;
  budget: number;
  last_at: string;
};

// ==================== FONCTIONS UTILITAIRES ====================

/** Lève une erreur explicite si une requête échoue (jamais d'échec silencieux). */
function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

/** Relit les décisions enregistrées ({ "0": { decision: "accepted", … } }). */
function readDecisions(raw: unknown): Record<number, CoachDecision> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<number, CoachDecision> = {};
  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    const decision = (entry as { decision?: unknown } | null)?.decision;
    if (/^\d+$/.test(key) && (decision === "accepted" || decision === "modified"
      || decision === "rejected")) {
      result[Number(key)] = decision;
    }
  }
  return result;
}

// ==================== MEMBRES ====================

/**
 * Consommation de l'étude ; le coach est désactivé si la clé de l'API manque.
 * @param studyId - Étude dont l'utilisateur est membre
 */
export async function getCoachUsage(studyId: string): Promise<CoachUsage> {
  const supabase = await createClient();
  const result = await supabase.rpc("coach_study_usage", { p_study_id: studyId });
  const row = (check(result, "consommation du coach") as
    { spent: number; budget: number; enabled: boolean }[])[0];
  return {
    spent: Number(row?.spent ?? 0),
    budget: Number(row?.budget ?? 0),
    enabled: Boolean(row?.enabled) && isCoachConfigured(),
  };
}

/**
 * État du coach pour une étape : consommation et dernière relecture réussie.
 * @param studyId - Étude dont l'utilisateur est membre
 * @param stepNo  - Étape affichée
 */
export async function getCoachState(studyId: string, stepNo: StepNo): Promise<CoachState> {
  const supabase = await createClient();
  const [usage, latest, rules] = await Promise.all([
    getCoachUsage(studyId),
    supabase
      .from("coach_requests")
      .select("id, output, decisions, revision:input->revision, created_at")
      .eq("study_id", studyId)
      .eq("step_no", stepNo)
      .eq("function", "review")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        output: unknown;
        decisions: unknown;
        revision: unknown;
        created_at: string;
      }>(),
    supabase
      .from("coach_rules")
      .select("code, title")
      .eq("active", true)
      .returns<CoachRuleTitle[]>(),
  ]);

  const row = check(latest, "dernière relecture");
  const review = row ? readReview(row.output) : null;
  return {
    usage,
    rules: check(rules, "règles du coach") ?? [],
    latest: row && review
      ? {
        requestId: row.id,
        review,
        decisions: readDecisions(row.decisions),
        revision: typeof row.revision === "number" ? row.revision : 0,
        createdAt: row.created_at,
      }
      : null,
  };
}

// ==================== ADMINISTRATION ====================

/** Réglages du coach (la RLS de strategy_settings réserve la lecture à l'administrateur). */
export async function getCoachSettings(): Promise<CoachSettings> {
  const supabase = await createClient();
  const result = await supabase
    .from("strategy_settings")
    .select(
      "coach_enabled, coach_model, coach_input_price, coach_output_price, "
        + "coach_study_budget, coach_rate_limit, coach_rate_window",
    )
    .maybeSingle<{
      coach_enabled: boolean;
      coach_model: string;
      coach_input_price: number;
      coach_output_price: number;
      coach_study_budget: number;
      coach_rate_limit: number;
      coach_rate_window: number;
    }>();
  const row = check(result, "réglages du coach");
  if (!row) throw new Error("Lecture impossible (réglages du coach) : ligne absente");
  return {
    enabled: row.coach_enabled,
    model: row.coach_model,
    inputPrice: Number(row.coach_input_price),
    outputPrice: Number(row.coach_output_price),
    budget: Number(row.coach_study_budget),
    rateLimit: row.coach_rate_limit,
    rateWindow: row.coach_rate_window,
  };
}

/** Consommation par étude (chiffres seulement), pour l'administrateur. */
export async function listCoachUsageForAdmin(): Promise<CoachUsageRow[]> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("admin_coach_usage"), "consommation du coach") as
    CoachUsageRow[];
  return rows.map((row) => ({ ...row, spent: Number(row.spent), budget: Number(row.budget) }));
}
