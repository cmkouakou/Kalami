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
 *               coach du plan stratégique (étape 9, S8a). Coach coupé par l'enseignant
 *               pour l'étape d'une étude de classe (S10a). Verrouillage (v0.11.1) : jauge
 *               en pourcentage du forfait, consommation détaillée, forfaits proposés et
 *               liste des forfaits pour l'administrateur ; jamais de dollars côté client.
 *               Remise enseignant des forfaits (v0.10.2).
 *  Auteur     : Claude Marcel
 *  Version    : 1.8
 *  Date       : 2026-10-19
 *  Dépendances: lib/supabase/server.ts, lib/supabase/admin.ts, coach/schemas.ts,
 *               coach/client.ts, coach/context.ts
 * =============================================================
 */

import "server-only";

import { getStudyClass } from "@/lib/strategy/class-queries";
import { coachDisabledFor } from "@/lib/strategy/classes";
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

/**
 * Consommation d'une étude, en pourcentage de son forfait (jamais en dollars). Le coach
 * est verrouillé tant que l'étude n'a aucun forfait.
 */
export type CoachUsage = {
  usedPct: number;
  /** Relectures encore possibles, à peu près. */
  remainingReviews: number;
  unlocked: boolean;
  enabled: boolean;
  /** Part typique du forfait consommée par une demande, par fonction. */
  estimates: Partial<Record<string, number>>;
};

/** Consommation d'une étape et d'une fonction (step null : analyse des pièces jointes). */
export type CoachBreakdownRow = {
  stepNo: StepNo | null;
  fn: string;
  requests: number;
  pct: number;
};

/** Forfait proposé : prix (vides tant que le paiement n'est pas ouvert), jamais le coût. */
export type CoachPackOffer = {
  id: string;
  name: string;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
  approxReviews: number;
  /** Remise accordée à l'enseignant de la classe (0 à 90 %). */
  teacherDiscountPct: number;
};

/** Forfait complet, pour l'administrateur (coût Anthropic couvert compris). */
export type CoachPackAdmin = {
  id: string;
  name: string;
  costUsd: number;
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
  active: boolean;
  position: number;
  /** Relectures à peu près couvertes (null si le forfait est retiré). */
  approxReviews: number | null;
  teacherDiscountPct: number;
};

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
  /** Coach coupé par l'enseignant pour cette étape (étude de classe, S10a). */
  classDisabled: boolean;
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
  last_at: string | null;
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
  const [usage, estimates] = await Promise.all([
    supabase.rpc("coach_study_usage", { p_study_id: studyId }),
    supabase.rpc("coach_function_estimates", { p_study_id: studyId }),
  ]);
  const row = (check(usage, "consommation du coach") as {
    used_pct: number;
    remaining_reviews: number;
    unlocked: boolean;
    enabled: boolean;
  }[])[0];
  const typical: Partial<Record<string, number>> = {};
  for (const entry of check(estimates, "estimations du coach") as
    { function: string; pct: number }[]) {
    typical[entry.function] = Number(entry.pct);
  }
  return {
    usedPct: Number(row?.used_pct ?? 0),
    remainingReviews: Number(row?.remaining_reviews ?? 0),
    unlocked: Boolean(row?.unlocked),
    enabled: Boolean(row?.enabled) && isCoachConfigured(),
    estimates: typical,
  };
}

/** Page du coach d'une étude : jauge, consommation détaillée et forfaits proposés. */
export type CoachOverview = {
  usage: CoachUsage;
  breakdown: CoachBreakdownRow[];
  offers: CoachPackOffer[];
};

/**
 * Consommation détaillée et forfaits proposés (pourcentages seulement, jamais de dollars).
 * @param studyId - Étude dont l'utilisateur est membre
 */
export async function getCoachOverview(studyId: string): Promise<CoachOverview> {
  const supabase = await createClient();
  const [usage, breakdown, offers] = await Promise.all([
    getCoachUsage(studyId),
    supabase.rpc("coach_study_breakdown", { p_study_id: studyId }),
    supabase.rpc("coach_pack_offers"),
  ]);
  return {
    usage,
    breakdown: (check(breakdown, "consommation détaillée") as {
      step_no: number | null;
      function: string;
      requests: number;
      pct: number;
    }[]).map((row) => ({
      stepNo: isStepNo(row.step_no) ? row.step_no : null,
      fn: row.function,
      requests: row.requests,
      pct: Number(row.pct),
    })),
    offers: (check(offers, "forfaits du coach") as {
      id: string;
      name: string;
      price_xof: number | null;
      price_eur: number | null;
      price_cad: number | null;
      approx_reviews: number;
      teacher_discount_pct: number | null;
    }[]).map((row) => ({
      id: row.id,
      name: row.name,
      priceXof: row.price_xof,
      priceEur: row.price_eur === null ? null : Number(row.price_eur),
      priceCad: row.price_cad === null ? null : Number(row.price_cad),
      approxReviews: row.approx_reviews,
      teacherDiscountPct: row.teacher_discount_pct ?? 0,
    })),
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
  const [usage, available, latest, deepen, score, research, synthesize, rules, studyClass] =
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
      getStudyClass(studyId),
    ]);

  return {
    usage,
    classDisabled: coachDisabledFor(studyClass, stepNo),
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

/**
 * Tous les forfaits, actifs ou non (RLS : administrateur seulement), avec le nombre
 * approximatif de relectures des forfaits actifs.
 */
export async function listCoachPacksForAdmin(): Promise<CoachPackAdmin[]> {
  const supabase = await createClient();
  const offers = check(await supabase.rpc("coach_pack_offers"), "forfaits proposés") as
    { id: string; approx_reviews: number }[];
  const approx = new Map(offers.map((offer) => [offer.id, offer.approx_reviews]));
  const rows = check(
    await supabase
      .from("coach_packs")
      .select(
        "id, name, cost_usd, price_xof, price_eur, price_cad, active, position, " +
          "teacher_discount_pct",
      )
      .order("position")
      .order("cost_usd")
      .returns<{
        id: string;
        name: string;
        cost_usd: number;
        price_xof: number | null;
        price_eur: number | null;
        price_cad: number | null;
        active: boolean;
        position: number;
        teacher_discount_pct: number;
      }[]>(),
    "forfaits du coach",
  ) ?? [];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    costUsd: Number(row.cost_usd),
    priceXof: row.price_xof,
    priceEur: row.price_eur === null ? null : Number(row.price_eur),
    priceCad: row.price_cad === null ? null : Number(row.price_cad),
    active: row.active,
    position: row.position,
    teacherDiscountPct: row.teacher_discount_pct,
    approxReviews: approx.get(row.id) ?? null,
  }));
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
        teacher_discount_pct: number;
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
        teacher_discount_pct: number;
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
    teacherDiscountPct: row.teacher_discount_pct,
    active: row.active,
    history: history.get(row.id) ?? [],
  }));
}
