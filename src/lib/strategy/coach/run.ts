/**
 * =============================================================
 *  Fichier    : run.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Déroulé serveur d'une relecture par le coach : lecture de l'étude et du
 *               gabarit enregistré (session de l'utilisateur, donc RLS), estimation du coût,
 *               réservation (rôle, débit, plafond vérifiés en SQL), appel à Claude avec
 *               sortie structurée, nettoyage, puis enregistrement des jetons et du coût.
 *               Toute demande réservée est terminée, même en cas d'erreur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: @anthropic-ai/sdk, coach/client.ts, coach/context.ts, coach/schemas.ts,
 *               lib/supabase/server.ts, lib/supabase/admin.ts
 * =============================================================
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { getDictionary } from "@/i18n";
import { getCoachClient, isCoachConfigured } from "@/lib/strategy/coach/client";
import { buildReviewMessage, rulesForStep, type CoachRule } from "@/lib/strategy/coach/context";
import {
  reviewOutputSchema,
  sanitizeReview,
  type Review,
} from "@/lib/strategy/coach/schemas";
import { readProfileData } from "@/lib/strategy/profile";
import { isStepNo, type StepNo } from "@/lib/strategy/steps";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

/** Plafond de jetons de sortie d'une relecture (réflexion comprise). */
const MAX_TOKENS = 12_000;

/** Approximation prudente : un jeton pour trois caractères de français. */
const CHARS_PER_TOKEN = 3;

/** En-tête bêta du repli automatique vers un autre modèle (forme « default »). */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

const s = getDictionary().strategy;

// ==================== TYPES ====================

/** Clés des messages d'erreur du coach (fr-strategy.ts, coach.errors). */
export type CoachErrorKey = keyof typeof s.coach.errors;

export type CoachRunResult =
  | { ok: true; requestId: string; review: Review }
  | { ok: false; error: CoachErrorKey };

type Reservation = {
  request_id: string | null;
  refusal: string | null;
  model: string | null;
  input_price: number | null;
  output_price: number | null;
};

type PromptRow = { id: string; body: string; step_no: number | null; version: number };

type RuleRow = { code: string; step_no: number | null; title: string; book_explanation: string };

type StudyRow = {
  company_name: string;
  strategic_question: string;
  company_profiles: { data: unknown } | null;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Coût maximal estimé d'une demande, en dollars US.
 * @param chars       - Taille du contexte (consigne + message), en caractères
 * @param inputPrice  - Prix d'un million de jetons en entrée
 * @param outputPrice - Prix d'un million de jetons en sortie
 */
export function estimateCost(chars: number, inputPrice: number, outputPrice: number): number {
  const inputTokens = Math.ceil(chars / CHARS_PER_TOKEN);
  return (inputTokens * inputPrice + MAX_TOKENS * outputPrice) / 1_000_000;
}

/** Traduit une erreur de l'API en message pour l'utilisateur. */
function apiErrorKey(error: unknown): CoachErrorKey {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.RateLimitError) return "busy";
  if (error instanceof Anthropic.APIError && error.status === 529) return "busy";
  return "failed";
}

/** Prix en vigueur, lus sans réserver (pour estimer avant la réservation). */
async function currentPrices(): Promise<{ input: number; output: number } | null> {
  const { data } = await createAdminClient()
    .from("strategy_settings")
    .select("coach_input_price, coach_output_price")
    .maybeSingle<{ coach_input_price: number; coach_output_price: number }>();
  return data ? { input: Number(data.coach_input_price), output: Number(data.coach_output_price) }
    : null;
}

/** Consigne de relecture en vigueur : celle de l'étape, sinon la consigne générale. */
async function activePrompt(stepNo: StepNo): Promise<{ id: string; body: string } | null> {
  const { data } = await createAdminClient()
    .from("coach_prompts")
    .select("id, body, step_no, version")
    .eq("function", "review")
    .or(`step_no.eq.${stepNo},step_no.is.null`)
    .order("version", { ascending: false })
    .returns<PromptRow[]>();
  const rows = data ?? [];
  return rows.find((row) => row.step_no === stepNo) ?? rows.find((row) => row.step_no === null)
    ?? null;
}

/** Erreurs classiques actives, dans l'ordre défini par l'administrateur. */
async function activeRules(): Promise<CoachRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_rules")
    .select("code, step_no, title, book_explanation")
    .eq("active", true)
    .order("position")
    .returns<RuleRow[]>();
  return (data ?? []).map((row) => ({
    code: row.code,
    stepNo: isStepNo(row.step_no) ? row.step_no : null,
    title: row.title,
    bookExplanation: row.book_explanation,
  }));
}

// ==================== RELECTURE ====================

/**
 * Lit l'étude et le gabarit enregistré ; null si l'utilisateur n'y a pas accès.
 * @param studyId - Identifiant de l'étude
 * @param stepNo  - Étape relue
 */
async function loadStudy(studyId: string, stepNo: StepNo) {
  const supabase = await createClient();
  const [study, step] = await Promise.all([
    supabase
      .from("studies")
      .select("company_name, strategic_question, company_profiles (data)")
      .eq("id", studyId)
      .maybeSingle<StudyRow>(),
    supabase
      .from("study_steps")
      .select("payload, revision")
      .eq("study_id", studyId)
      .eq("step_no", stepNo)
      .maybeSingle<{ payload: unknown; revision: number }>(),
  ]);
  if (!study.data || !step.data) return null;
  return { study: study.data, payload: step.data.payload, revision: step.data.revision };
}

/**
 * Réserve la demande dans la base ; renvoie la réservation ou la clé du refus.
 * @param studyId  - Identifiant de l'étude
 * @param stepNo   - Étape relue
 * @param estimate - Coût maximal estimé (dollars US)
 */
async function reserve(
  studyId: string,
  stepNo: StepNo,
  estimate: number,
): Promise<Reservation | CoachErrorKey> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_reserve", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_function: "review",
    p_estimate: Number(estimate.toFixed(6)),
  });
  if (error) {
    if (error.message === "prerequisites_missing") return "prerequisites_missing";
    if (error.message === "step_validated") return "step_validated";
    return error.code === "42501" ? "forbidden" : "failed";
  }
  const row = (data as Reservation[] | null)?.[0];
  if (!row) return "failed";
  if (row.refusal === "coach_disabled" || row.refusal === "rate_limited"
    || row.refusal === "budget_exhausted") {
    return row.refusal;
  }
  return row.request_id ? row : "failed";
}

/** Enregistre l'issue d'une demande réservée (rôle service). */
async function complete(
  requestId: string,
  values: {
    status: "done" | "failed" | "refused";
    promptId: string | null;
    servedModel: string | null;
    inputTokens: number;
    outputTokens: number;
    input: unknown;
    output: unknown;
    error: string | null;
  },
): Promise<void> {
  const { error } = await createAdminClient().rpc("coach_complete", {
    p_request_id: requestId,
    p_status: values.status,
    p_prompt_id: values.promptId,
    p_served_model: values.servedModel,
    p_input_tokens: values.inputTokens,
    p_output_tokens: values.outputTokens,
    p_input: values.input,
    p_output: values.output,
    p_error: values.error,
  });
  if (error) throw new Error(`coach_complete : ${error.message}`);
}

/**
 * Lance une relecture du gabarit enregistré d'une étape.
 *
 * @param studyId - Identifiant de l'étude (déjà vérifié)
 * @param stepNo  - Étape dotée d'un gabarit
 * @returns Relecture nettoyée, ou clé du message d'erreur
 *
 * Erreurs possibles :
 *   - unavailable si la clé de l'API manque, rate_limited / budget_exhausted si refusé
 */
export async function runReview(studyId: string, stepNo: StepNo): Promise<CoachRunResult> {
  if (!isCoachConfigured()) return { ok: false, error: "unavailable" };

  const [loaded, prompt, rules, prices] = await Promise.all([
    loadStudy(studyId, stepNo),
    activePrompt(stepNo),
    activeRules(),
    currentPrices(),
  ]);
  if (!loaded) return { ok: false, error: "forbidden" };
  if (!prompt || !prices) return { ok: false, error: "unavailable" };

  const message = buildReviewMessage({
    companyName: loaded.study.company_name,
    strategicQuestion: loaded.study.strategic_question,
    profile: readProfileData(loaded.study.company_profiles?.data),
    stepNo,
    stepTitle: s.steps[stepNo].title,
    payload: loaded.payload,
    rules,
  });
  const estimate = estimateCost(prompt.body.length + message.length, prices.input, prices.output);

  const reservation = await reserve(studyId, stepNo, estimate);
  if (typeof reservation === "string") return { ok: false, error: reservation };

  const requestId = reservation.request_id as string;
  const ruleCodes = rulesForStep(rules, stepNo).map((rule) => rule.code);
  const input = { revision: loaded.revision, payload: loaded.payload };
  return callModel(requestId, reservation.model as string, prompt, message, ruleCodes, input);
}

/**
 * Appelle Claude puis termine la demande réservée, quelle qu'en soit l'issue.
 * @param requestId - Demande réservée
 * @param model     - Modèle configuré par l'administrateur
 * @param prompt    - Consigne système en vigueur
 * @param message   - Message construit par buildReviewMessage
 * @param ruleCodes - Codes des règles transmises
 * @param input     - Révision et contenu relus (conservés avec la demande)
 */
async function callModel(
  requestId: string,
  model: string,
  prompt: { id: string; body: string },
  message: string,
  ruleCodes: string[],
  input: { revision: number; payload: unknown },
): Promise<CoachRunResult> {
  const base = { promptId: prompt.id, input };
  let usage = { servedModel: null as string | null, inputTokens: 0, outputTokens: 0 };
  try {
    const response = await getCoachClient().beta.messages.parse({
      model,
      max_tokens: MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: prompt.body,
      messages: [{ role: "user", content: message }],
      output_config: { format: betaZodOutputFormat(reviewOutputSchema) },
    });
    usage = {
      servedModel: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    if (response.stop_reason === "refusal") {
      await complete(requestId, { ...base, ...usage, status: "refused", output: null,
        error: response.stop_details?.category ?? "refusal" });
      return { ok: false, error: "refused" };
    }
    if (!response.parsed_output) {
      await complete(requestId, { ...base, ...usage, status: "failed", output: null,
        error: `sortie illisible (${response.stop_reason ?? "inconnu"})` });
      return { ok: false, error: "failed" };
    }

    const review = sanitizeReview(response.parsed_output, ruleCodes);
    await complete(requestId, { ...base, ...usage, status: "done", output: review, error: null });
    return { ok: true, requestId, review };
  } catch (error) {
    // Jetons conservés si l'appel a abouti mais que l'enregistrement a échoué
    const key = apiErrorKey(error);
    await complete(requestId, { ...base, ...usage, status: "failed", output: null,
      error: error instanceof Error ? error.message : key })
      .catch(() => undefined);
    return { ok: false, error: key };
  }
}
