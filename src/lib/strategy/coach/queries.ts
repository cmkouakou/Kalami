/**
 * =============================================================
 *  Fichier    : queries.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Lectures du coach avec la session de l'utilisateur (membres de l'étude
 *               seulement) : consommation de l'étude par rapport à son plafond, dernier
 *               résultat réussi de chaque fonction (relecture, questions, évaluation,
 *               recherche Web) pour une étape, avec les décisions déjà prises, et fonctions
 *               disponibles (consigne publiée, recherche aux étapes 1 et 2 seulement).
 *               Lectures de l'administrateur : réglages, consommation par étude, versions
 *               des consignes (dont « extract », S5b) et erreurs classiques avec leur historique.
 *               Dernières propositions de synthèse (synthesize) à l'étape 5 (S6b). État du
 *               coach du plan stratégique (étape 9, S8a).
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-15
 *  Dépendances: lib/supabase/server.ts, lib/supabase/admin.ts, coach/schemas.ts,
 *               coach/client.ts, coach/context.ts
 * =============================================================
 */

import "server-only";

import { isCoachConfigured } from "@/lib/strategy/coach/client";
import {
  isFunctionAvailable,
  PROMPT_FUNCTIONS,
  type CoachFunction,
  type PromptFunction,
} from "@/lib/strategy/coach/context";
import {
  readDeepen,
  readResearch,
  readReview,
  readScore,
  readSynthesize,
  type Deepen,
  type Research,
  type Review,
  type Score,
  type Synthesize,
} from "@/lib/strategy/coach/schemas";
import { isStepNo, PLAN_STEP, type StepNo } from "@/lib/strategy/steps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

export type CoachDecision = "accepted" | "modified" | "rejected";

/** Consommation d'une étude (dollars US). */
export type CoachUsage = { spent: number; budget: number; enabled: boolean };

/** Dernier résultat d'une fonction du coach, affiché dans le panneau. */
export type CoachResult<T> = {
  requestId: string;
  output: T;
  /** Décision par indice de suggestion ou de question. */
  decisions: Record<number, CoachDecision>;
  /** Révision du gabarit soumise (pour signaler un résultat dépassé). */
  revision: number;
  createdAt: string;
};

export type CoachReview = CoachResult<Review>;
export type CoachDeepen = CoachResult<Deepen>;
export type CoachScore = CoachResult<Score>;
export type CoachResearch = CoachResult<Research>;
export type CoachSynthesize = CoachResult<Synthesize>;

/** Erreur classique citée dans une suggestion ; l'explication du livre peut être vide. */
export type CoachRuleTitle = { code: string; title: string; bookExplanation: string };

/** État du coach transmis au gabarit par la page. */
export type CoachState = {
  usage: CoachUsage;
  /** Fonctions dont une consigne est publiée (les autres restent indisponibles). */
  available: Record<CoachFunction, boolean>;
  latest: CoachReview | null;
  deepen: CoachDeepen | null;
  score: CoachScore | null;
  research: CoachResearch | null;
  synthesize: CoachSynthesize | null;
  rules: CoachRuleTitle[];
};

/** Version d'une consigne, pour l'administration. */
export type CoachPromptVersion = {
  id: string;
  fn: PromptFunction;
  stepNo: StepNo | null;
  version: number;
  body: string;
  note: string | null;
  createdAt: string;
  /** null pour un brouillon. */
  publishedAt: string | null;
};

/** État passé d'une erreur classique. */
export type CoachRuleVersion = {
  stepNo: StepNo | null;
  title: string;
  bookExplanation: string;
  position: number;
  active: boolean;
  changedAt: string;
};

/** Erreur classique avec son historique, pour l'administration. */
export type CoachRuleAdmin = {
  id: string;
  code: string;
  stepNo: StepNo | null;
  title: string;
  bookExplanation: string;
  position: number;
  active: boolean;
  history: CoachRuleVersion[];
};

export type CoachSettings = {
  enabled: boolean;
  model: string;
  inputPrice: number;
  outputPrice: number;
  budget: number;
  rateLimit: number;
  rateWindow: number;
  /** Prix d'une recherche Web (dollars US). */
  searchPrice: number;
  /** Nombre maximal de recherches par demande. */
  searchMaxUses: number;
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
export function check<T>(
  result: { data: T | null; error: { message: string } | null },
  what: string,
): T {
  if (result.error) throw new Error(`Lecture impossible (${what}) : ${result.error.message}`);
  return result.data as T;
}

/** Relit les décisions enregistrées ({ "0": { decision: "accepted", … } }). */
export function readDecisions(raw: unknown): Record<number, CoachDecision> {
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

type ResultRow = {
  id: string;
  output: unknown;
  decisions: unknown;
  revision: unknown;
  created_at: string;
};

/**
 * Dernier résultat réussi d'une fonction pour une étape, relu par le lecteur donné.
 * @param studyId - Étude dont l'utilisateur est membre
 * @param stepNo  - Étape affichée
 * @param fn      - Fonction du coach
 * @param read    - Relecture de la colonne output (null si illisible)
 */
async function latestResult<T>(
  studyId: string,
  stepNo: StepNo,
  fn: CoachFunction,
  read: (raw: unknown) => T | null,
): Promise<CoachResult<T> | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("coach_requests")
    .select("id, output, decisions, revision:input->revision, created_at")
    .eq("study_id", studyId)
    .eq("step_no", stepNo)
    .eq("function", fn)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResultRow>();
  const row = check(result, `dernier résultat (${fn})`);
  const output = row ? read(row.output) : null;
  if (!row || !output) return null;
  return {
    requestId: row.id,
    output,
    decisions: readDecisions(row.decisions),
    revision: typeof row.revision === "number" ? row.revision : 0,
    createdAt: row.created_at,
  };
}

/**
 * Fonctions dont une consigne est publiée pour l'étape (ou en général) et qui sont offertes
 * à cette étape. Lecture faite avec le rôle service : seuls les noms des fonctions sortent,
 * jamais le texte des consignes.
 * @param stepNo - Étape affichée
 */
async function availableFunctions(stepNo: StepNo): Promise<Record<CoachFunction, boolean>> {
  const result = await createAdminClient()
    .from("coach_prompts")
    .select("function")
    .not("published_at", "is", null)
    .or(`step_no.eq.${stepNo},step_no.is.null`)
    .returns<{ function: string }[]>();
  const published = new Set((check(result, "consignes publiées") ?? []).map((row) => row.function));
  const available = (fn: CoachFunction) => published.has(fn) && isFunctionAvailable(fn, stepNo);
  return {
    review: available("review"),
    deepen: available("deepen"),
    score: available("score"),
    research: available("research"),
    synthesize: available("synthesize"),
  };
}

/** État du coach du plan stratégique : consommation et consigne « plan » publiée. */
export type PlanCoachState = { usage: CoachUsage; available: boolean };

/**
 * État du coach pour le plan (étape 9). Lecture de la consigne avec le rôle service : seule
 * sa présence sort, jamais son texte.
 * @param studyId - Étude dont l'utilisateur est membre
 */
export async function getPlanCoachState(studyId: string): Promise<PlanCoachState> {
  const [usage, prompts] = await Promise.all([
    getCoachUsage(studyId),
    createAdminClient()
      .from("coach_prompts")
      .select("id")
      .eq("function", "plan")
      .not("published_at", "is", null)
      .or(`step_no.eq.${PLAN_STEP},step_no.is.null`)
      .limit(1)
      .returns<{ id: string }[]>(),
  ]);
  return { usage, available: (check(prompts, "consigne du plan") ?? []).length > 0 };
}

/**
 * État du coach pour une étape : consommation, fonctions disponibles et dernier résultat
 * réussi de chaque fonction.
 * @param studyId - Étude dont l'utilisateur est membre
 * @param stepNo  - Étape affichée
 */
export async function getCoachState(studyId: string, stepNo: StepNo): Promise<CoachState> {
  const supabase = await createClient();
  const [usage, available, latest, deepen, score, research, synthesize, rules] =
    await Promise.all([
      getCoachUsage(studyId),
      availableFunctions(stepNo),
      latestResult(studyId, stepNo, "review", readReview),
      latestResult(studyId, stepNo, "deepen", readDeepen),
      latestResult(studyId, stepNo, "score", readScore),
      isFunctionAvailable("research", stepNo)
        ? latestResult(studyId, stepNo, "research", readResearch)
        : Promise.resolve(null),
      isFunctionAvailable("synthesize", stepNo)
        ? latestResult(studyId, stepNo, "synthesize", readSynthesize)
        : Promise.resolve(null),
      supabase
        .from("coach_rules")
        .select("code, title, book_explanation")
        .eq("active", true)
        .returns<{ code: string; title: string; book_explanation: string }[]>(),
    ]);

  return {
    usage,
    available,
    latest,
    deepen,
    score,
    research,
    synthesize,
    rules: (check(rules, "règles du coach") ?? []).map((rule) => ({
      code: rule.code,
      title: rule.title,
      bookExplanation: rule.book_explanation,
    })),
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
        + "coach_study_budget, coach_rate_limit, coach_rate_window, coach_search_price, "
        + "coach_search_max_uses",
    )
    .maybeSingle<{
      coach_enabled: boolean;
      coach_model: string;
      coach_input_price: number;
      coach_output_price: number;
      coach_study_budget: number;
      coach_rate_limit: number;
      coach_rate_window: number;
      coach_search_price: number;
      coach_search_max_uses: number;
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
    searchPrice: Number(row.coach_search_price),
    searchMaxUses: row.coach_search_max_uses,
  };
}

/** Consommation par étude (chiffres seulement), pour l'administrateur. */
export async function listCoachUsageForAdmin(): Promise<CoachUsageRow[]> {
  const supabase = await createClient();
  const rows = check(await supabase.rpc("admin_coach_usage"), "consommation du coach") as
    CoachUsageRow[];
  return rows.map((row) => ({ ...row, spent: Number(row.spent), budget: Number(row.budget) }));
}

/** Toutes les versions des consignes (RLS : administrateur seulement), récentes d'abord. */
export async function listCoachPromptsForAdmin(): Promise<CoachPromptVersion[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("coach_prompts")
      .select("id, function, step_no, version, body, note, created_at, published_at")
      .order("version", { ascending: false })
      .returns<{
        id: string;
        function: string;
        step_no: number | null;
        version: number;
        body: string;
        note: string | null;
        created_at: string;
        published_at: string | null;
      }[]>(),
    "consignes du coach",
  ) ?? [];
  return rows
    .filter((row) => (PROMPT_FUNCTIONS as readonly string[]).includes(row.function))
    .map((row) => ({
      id: row.id,
      fn: row.function as PromptFunction,
      stepNo: isStepNo(row.step_no) ? row.step_no : null,
      version: row.version,
      body: row.body,
      note: row.note,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    }));
}

/** Erreurs classiques, actives ou non, avec leur historique (récent d'abord). */
export async function listCoachRulesForAdmin(): Promise<CoachRuleAdmin[]> {
  const supabase = await createClient();
  const [rules, versions] = await Promise.all([
    supabase
      .from("coach_rules")
      .select("id, code, step_no, title, book_explanation, position, active")
      .order("position")
      .returns<{
        id: string;
        code: string;
        step_no: number | null;
        title: string;
        book_explanation: string;
        position: number;
        active: boolean;
      }[]>(),
    supabase
      .from("coach_rule_versions")
      .select("rule_id, step_no, title, book_explanation, position, active, changed_at")
      .order("changed_at", { ascending: false })
      .returns<{
        rule_id: string;
        step_no: number | null;
        title: string;
        book_explanation: string;
        position: number;
        active: boolean;
        changed_at: string;
      }[]>(),
  ]);

  const history = new Map<string, CoachRuleVersion[]>();
  for (const row of check(versions, "historique des règles") ?? []) {
    const list = history.get(row.rule_id) ?? [];
    list.push({
      stepNo: isStepNo(row.step_no) ? row.step_no : null,
      title: row.title,
      bookExplanation: row.book_explanation,
      position: row.position,
      active: row.active,
      changedAt: row.changed_at,
    });
    history.set(row.rule_id, list);
  }

  return (check(rules, "règles du coach") ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    stepNo: isStepNo(row.step_no) ? row.step_no : null,
    title: row.title,
    bookExplanation: row.book_explanation,
    position: row.position,
    active: row.active,
    history: history.get(row.id) ?? [],
  }));
}
