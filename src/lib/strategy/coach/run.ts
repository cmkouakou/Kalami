/**
 * =============================================================
 *  Fichier    : run.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Déroulé serveur d'une demande au coach (relecture, questions, évaluation ou
 *               recherche Web) : lecture de l'étude et du gabarit enregistré (session de
 *               l'utilisateur, donc RLS), estimation du coût, réservation (rôle, débit,
 *               plafond vérifiés en SQL), appel à Claude, nettoyage, puis enregistrement des
 *               jetons, des recherches, du coût et des sources. La recherche passe par l'outil
 *               serveur web_search et l'outil soumettre_faits (les citations de la recherche
 *               excluent la sortie structurée). Seule une consigne publiée sert ; un brouillon
 *               n'est jamais utilisé. Toute demande réservée est terminée, même en cas d'erreur.
 *               Briques exportées pour l'analyse des pièces jointes (extract.ts, S5b).
 *               À l'étape 5, le contenu des étapes 1 à 4 est joint au message, et le
 *               préremplissage (synthesize) est nettoyé selon les éléments connus (S6b).
 *               Aux étapes 6 et 7, les étapes en amont déjà rédigées (synthèse, cap) sont
 *               jointes pour juger la cohérence (S7a) ; à l'étape 8, synthèse, cap et choix (S7b).
 *               Refus « coach_disabled_step » : coach coupé par l'enseignant (S10a).
 *               Refus « coach_locked » : aucun forfait pour l'étude. Mémoire des
 *               relectures : une relance de relecture ou de questions reçoit les
 *               propositions précédentes et les décisions de l'équipe (v0.11.1).
 *  Auteur     : Claude Marcel
 *  Version    : 1.8
 *  Date       : 2026-10-16
 *  Dépendances: @anthropic-ai/sdk, coach/client.ts, coach/context.ts, coach/schemas.ts,
 *               lib/supabase/server.ts, lib/supabase/admin.ts
 * =============================================================
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

import { getDictionary } from "@/i18n";
import { getCoachClient, isCoachConfigured } from "@/lib/strategy/coach/client";
import {
  buildCoachMessage,
  HISTORY_FUNCTIONS,
  rulesForStep,
  type ChecklistLine,
  type CoachFunction,
  type CoachHistoryItem,
  type CoachRule,
  SYNTHESIS_STEP,
  type PromptFunction,
  type SourceStepContent,
} from "@/lib/strategy/coach/context";
import {
  deepenOutputSchema,
  researchOutputSchema,
  researchTargets,
  reviewOutputSchema,
  sanitizeDeepen,
  sanitizeResearch,
  sanitizeReview,
  sanitizeScore,
  sanitizeSynthesize,
  scoreOutputSchema,
  synthesizeOutputSchema,
  readDeepen,
  readReview,
  type Deepen,
  type Research,
  type Review,
  type Score,
  type SearchHit,
  type Synthesize,
} from "@/lib/strategy/coach/schemas";
import { readDecisions } from "@/lib/strategy/coach/queries";
import { readProfileData, type ProfileData } from "@/lib/strategy/profile";
import { getSourcePayloads } from "@/lib/strategy/queries";
import { isStepNo, type StepNo } from "@/lib/strategy/steps";
import { knownIds, type ProposalSources } from "@/lib/strategy/synthesis-proposals";
import { checklistFor, hasTemplate, type TemplateStep } from "@/lib/strategy/templates";
import { readChoice } from "@/lib/strategy/templates/choice";
import { readDirection } from "@/lib/strategy/templates/direction";
import { readForces } from "@/lib/strategy/templates/forces";
import { readInternal } from "@/lib/strategy/templates/internal";
import { readPestel } from "@/lib/strategy/templates/pestel";
import { readStakeholders } from "@/lib/strategy/templates/stakeholders";
import { readSynthesis } from "@/lib/strategy/templates/synthesis";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

/** Plafond de jetons de sortie d'une demande (réflexion comprise). */
export const MAX_TOKENS = 12_000;

/** Approximation prudente : un jeton pour trois caractères de français. */
export const CHARS_PER_TOKEN = 3;

/** En-tête bêta du repli automatique vers un autre modèle (forme « default »). */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Reprises au plus après une pause de l'outil serveur (stop_reason « pause_turn »). */
const MAX_CONTINUATIONS = 5;

/**
 * Jetons d'entrée prévus par recherche (résultats renvoyés au modèle) : marge prudente
 * pour l'estimation seulement ; le coût enregistré vient de l'usage réel.
 */
const SEARCH_INPUT_ALLOWANCE = 10_000;

/** Nom de l'outil client par lequel le modèle remet ses faits. */
const SUBMIT_TOOL = "soumettre_faits";

const s = getDictionary().strategy;

// ==================== TYPES ====================

/** Clés des messages d'erreur du coach (fr-strategy.ts, coach.errors). */
export type CoachErrorKey = keyof typeof s.coach.errors;

/** Résultat nettoyé de chaque fonction du coach. */
export type CoachOutputs = {
  review: Review;
  deepen: Deepen;
  score: Score;
  research: Research;
  synthesize: Synthesize;
};

export type CoachRunResult<F extends CoachFunction = CoachFunction> =
  | { ok: true; requestId: string; output: CoachOutputs[F] }
  | { ok: false; error: CoachErrorKey };

type Reservation = {
  request_id: string | null;
  refusal: string | null;
  model: string | null;
  input_price: number | null;
  output_price: number | null;
  search_max_uses: number | null;
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
export function apiErrorKey(error: unknown): CoachErrorKey {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.RateLimitError) return "busy";
  if (error instanceof Anthropic.APIError && error.status === 529) return "busy";
  return "failed";
}

type Prices = { model: string; input: number; output: number; searchMaxUses: number };

/** Prix en vigueur, lus sans réserver (pour estimer avant la réservation). */
export async function currentPrices(): Promise<Prices | null> {
  const { data } = await createAdminClient()
    .from("strategy_settings")
    .select("coach_model, coach_input_price, coach_output_price, coach_search_max_uses")
    .maybeSingle<{
      coach_model: string;
      coach_input_price: number;
      coach_output_price: number;
      coach_search_max_uses: number;
    }>();
  if (!data) return null;
  return {
    model: data.coach_model,
    input: Number(data.coach_input_price),
    output: Number(data.coach_output_price),
    searchMaxUses: Number(data.coach_search_max_uses),
  };
}

/** Libellés de la liste de contrôle de chaque gabarit. */
const CHECKLIST_LABELS: Record<TemplateStep, Record<string, string>> = {
  1: s.pestel.checklist,
  2: s.forces.checklist,
  3: s.internal.checklist,
  4: s.stakeholders.checklist,
  5: s.synthesis.checklist,
  6: s.direction.checklist,
  7: s.choice.checklist,
  8: s.action.checklist,
};

/** Liste de contrôle lisible du contenu enregistré d'une étape. */
function checklistLines(stepNo: StepNo, payload: unknown): ChecklistLine[] {
  if (!hasTemplate(stepNo)) return [];
  return checklistFor(stepNo, payload).map((item) => ({
    label: CHECKLIST_LABELS[stepNo][item.key] ?? item.key,
    ok: item.ok,
  }));
}

/**
 * Consigne publiée en vigueur pour une fonction : celle de l'étape, sinon la consigne
 * générale (seule possible pour extract, stepNo null). Les brouillons (published_at null)
 * sont ignorés.
 */
export async function activePrompt(
  fn: PromptFunction,
  stepNo: StepNo | null,
): Promise<{ id: string; body: string } | null> {
  const query = createAdminClient()
    .from("coach_prompts")
    .select("id, body, step_no, version")
    .eq("function", fn)
    .not("published_at", "is", null);
  const { data } = await (stepNo === null
    ? query.is("step_no", null)
    : query.or(`step_no.eq.${stepNo},step_no.is.null`))
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
 * @param stepNo  - Étape concernée
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
 * Propositions de la dernière demande réussie de la même fonction pour l'étape, avec la
 * décision de l'équipe (session de l'utilisateur, donc RLS). Vide pour les autres fonctions.
 * @param fn      - Fonction demandée
 * @param studyId - Identifiant de l'étude (déjà vérifié)
 * @param stepNo  - Étape demandée
 */
async function loadHistory(
  fn: CoachFunction,
  studyId: string,
  stepNo: StepNo,
): Promise<CoachHistoryItem[]> {
  if (!HISTORY_FUNCTIONS.includes(fn)) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_requests")
    .select("output, decisions")
    .eq("study_id", studyId)
    .eq("step_no", stepNo)
    .eq("function", fn)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ output: unknown; decisions: unknown }>();
  if (!data) return [];
  const decisions = readDecisions(data.decisions);
  const texts = fn === "review"
    ? (readReview(data.output)?.suggestions ?? []).map((item) =>
      item.proposal ? `${item.title} — ${item.proposal}` : item.title)
    : (readDeepen(data.output)?.questions ?? []).map((item) => item.question);
  return texts.map((text, index) => ({ text, decision: decisions[index] ?? null }));
}

/** Étapes antérieures relues, pour le message et pour le nettoyage des propositions. */
type SynthesisContext = { sources: ProposalSources; message: SourceStepContent[] };

/**
 * Lit et relit les étapes 1 à 4 de l'étude (session de l'utilisateur, donc RLS).
 * @param studyId     - Identifiant de l'étude (déjà vérifié)
 * @param companyName - Nom de l'organisation (gabarit des cinq forces)
 * @param profile     - Profil relu (concurrents du gabarit des cinq forces)
 */
async function loadSynthesisContext(
  studyId: string,
  companyName: string,
  profile: ProfileData,
): Promise<SynthesisContext> {
  const raw = await getSourcePayloads(studyId, [1, 2, 3, 4]);
  const pestel = readPestel(raw[1]);
  const forces = readForces(raw[2], companyName, profile.competitors);
  const internal = readInternal(raw[3]);
  const stakeholders = readStakeholders(raw[4]);
  const payloads: [StepNo, unknown][] = [[1, pestel], [2, forces], [3, internal],
    [4, stakeholders]];
  return {
    sources: { pestel, internal, stakeholders },
    message: payloads.map(([stepNo, payload]) => ({
      stepNo,
      title: s.steps[stepNo].title,
      payload,
    })),
  };
}

/** Étapes en amont jointes au message, par étape (contexte de cohérence). */
const UPSTREAM_STEPS: Partial<Record<StepNo, readonly StepNo[]>> = {
  6: [5],
  7: [5, 6],
  8: [5, 6, 7],
};

/** Lecteurs tolérants des étapes en amont (contenu propre, sans champ inconnu). */
const UPSTREAM_READERS: Partial<Record<StepNo, (raw: unknown) => unknown>> = {
  5: readSynthesis,
  6: readDirection,
  7: readChoice,
};

/**
 * Lit les étapes en amont de l'étape (session de l'utilisateur, donc RLS).
 * @param studyId - Identifiant de l'étude (déjà vérifié)
 * @param stepNo  - Étape demandée
 * @returns Contenu des étapes en amont, ou undefined si l'étape n'en a pas
 */
async function loadUpstreamContext(
  studyId: string,
  stepNo: StepNo,
): Promise<SourceStepContent[] | undefined> {
  const steps = UPSTREAM_STEPS[stepNo];
  if (!steps) return undefined;
  const raw = await getSourcePayloads(studyId, steps);
  return steps.map((no) => ({
    stepNo: no,
    title: s.steps[no].title,
    payload: UPSTREAM_READERS[no]?.(raw[no]) ?? raw[no],
  }));
}

/**
 * Réserve la demande dans la base ; renvoie la réservation ou la clé du refus.
 * @param fn           - Fonction demandée
 * @param studyId      - Identifiant de l'étude
 * @param stepNo       - Étape concernée (null pour extract)
 * @param estimate     - Coût maximal estimé (dollars US)
 * @param attachmentId - Pièce jointe analysée (extract seulement)
 */
export async function reserve(
  fn: PromptFunction,
  studyId: string,
  stepNo: StepNo | null,
  estimate: number,
  attachmentId: string | null = null,
): Promise<Reservation | CoachErrorKey> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_reserve", {
    p_study_id: studyId,
    p_step_no: stepNo,
    p_function: fn,
    p_estimate: Number(estimate.toFixed(6)),
    p_attachment_id: attachmentId,
  });
  if (error) {
    if (error.message === "prerequisites_missing") return "prerequisites_missing";
    if (error.message === "step_validated") return "step_validated";
    return error.code === "42501" ? "forbidden" : "failed";
  }
  const row = (data as Reservation[] | null)?.[0];
  if (!row) return "failed";
  if (row.refusal === "coach_disabled" || row.refusal === "coach_disabled_step"
    || row.refusal === "coach_locked" || row.refusal === "rate_limited"
    || row.refusal === "budget_exhausted") {
    return row.refusal;
  }
  return row.request_id ? row : "failed";
}

/** Enregistre l'issue d'une demande réservée (rôle service). */
export async function complete(
  requestId: string,
  values: {
    status: "done" | "failed" | "refused";
    promptId: string | null;
    servedModel: string | null;
    inputTokens: number;
    outputTokens: number;
    webSearches?: number;
    input: unknown;
    output: unknown;
    sources?: unknown;
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
    p_web_searches: values.webSearches ?? 0,
    p_input: values.input,
    p_output: values.output,
    p_sources: values.sources ?? null,
    p_error: values.error,
  });
  if (error) throw new Error(`coach_complete : ${error.message}`);
}

/**
 * Lance une demande au coach sur le gabarit enregistré d'une étape.
 *
 * @param fn      - review (relecture), deepen (questions), score (évaluation), research
 *                  ou synthesize (préremplissage de l'étape 5)
 * @param studyId - Identifiant de l'étude (déjà vérifié)
 * @param stepNo  - Étape dotée d'un gabarit
 * @returns Résultat nettoyé, ou clé du message d'erreur
 *
 * Erreurs possibles :
 *   - unavailable si la clé de l'API manque, not_published si aucune consigne n'est
 *     publiée, rate_limited / budget_exhausted si la base refuse
 */
export async function runCoach<F extends CoachFunction>(
  fn: F,
  studyId: string,
  stepNo: StepNo,
): Promise<CoachRunResult<F>> {
  if (!isCoachConfigured()) return { ok: false, error: "unavailable" };

  const [loaded, prompt, rules, prices, history] = await Promise.all([
    loadStudy(studyId, stepNo),
    activePrompt(fn, stepNo),
    activeRules(),
    currentPrices(),
    loadHistory(fn, studyId, stepNo),
  ]);
  if (!loaded) return { ok: false, error: "forbidden" };
  if (!prompt) return { ok: false, error: "not_published" };
  if (!prices) return { ok: false, error: "unavailable" };

  const profile = readProfileData(loaded.study.company_profiles?.data);
  const synthesis = stepNo === SYNTHESIS_STEP
    ? await loadSynthesisContext(studyId, loaded.study.company_name, profile)
    : null;
  const upstream = synthesis ? undefined : await loadUpstreamContext(studyId, stepNo);
  const message = buildCoachMessage(fn, {
    companyName: loaded.study.company_name,
    strategicQuestion: loaded.study.strategic_question,
    profile,
    stepNo,
    stepTitle: s.steps[stepNo].title,
    payload: loaded.payload,
    rules,
    checklist: fn === "score" ? checklistLines(stepNo, loaded.payload) : undefined,
    targets: fn === "research" ? researchTargets(stepNo) : undefined,
    sources: synthesis?.message ?? upstream,
    history,
  });
  // Recherche : marge pour les résultats renvoyés (le prix des recherches est ajouté en SQL)
  const searchChars = fn === "research"
    ? prices.searchMaxUses * SEARCH_INPUT_ALLOWANCE * CHARS_PER_TOKEN : 0;
  const estimate = estimateCost(
    prompt.body.length + message.length + searchChars, prices.input, prices.output);

  const reservation = await reserve(fn, studyId, stepNo, estimate);
  if (typeof reservation === "string") return { ok: false, error: reservation };

  const call: ModelCall = {
    requestId: reservation.request_id as string,
    model: reservation.model as string,
    prompt,
    message,
    input: { revision: loaded.revision, payload: loaded.payload },
  };
  const ruleCodes = rulesForStep(rules, stepNo).map((rule) => rule.code);
  // Chaque fonction a son schéma de sortie et son nettoyage
  const outputs: { [K in CoachFunction]: () => Promise<CoachRunResult<K>> } = {
    review: () => callModel(call, reviewOutputSchema, (raw) => sanitizeReview(raw, ruleCodes)),
    deepen: () => callModel(call, deepenOutputSchema, sanitizeDeepen),
    score: () => callModel(call, scoreOutputSchema, (raw) => sanitizeScore(raw, ruleCodes)),
    research: () => callResearch(call, stepNo, reservation.search_max_uses ?? 1),
    synthesize: () => {
      // Réservé à l'étape 5 en SQL : le contexte des étapes est donc toujours présent
      const known = knownIds(
        synthesis?.sources ?? { pestel: readPestel(null), internal: readInternal(null),
          stakeholders: readStakeholders(null) },
        readSynthesis(loaded.payload),
      );
      return callModel(call, synthesizeOutputSchema, (raw) => sanitizeSynthesize(raw, known));
    },
  };
  return outputs[fn]() as Promise<CoachRunResult<F>>;
}

/** Demande réservée, prête à être envoyée au modèle. */
export type ModelCall = {
  requestId: string;
  /** Modèle configuré par l'administrateur */
  model: string;
  /** Consigne système publiée en vigueur */
  prompt: { id: string; body: string };
  /** Message construit par buildCoachMessage, ou blocs (pièce jointe puis texte) */
  message: string | Anthropic.Beta.BetaContentBlockParam[];
  /** Contenu soumis, conservé avec la demande (jamais le document lui-même) */
  input: unknown;
};

/**
 * Appelle Claude puis termine la demande réservée, quelle qu'en soit l'issue.
 * @param call     - Demande réservée
 * @param schema   - Schéma de la sortie structurée
 * @param sanitize - Nettoyage de la sortie validée
 */
export async function callModel<S extends z.ZodType, T>(
  call: ModelCall,
  schema: S,
  sanitize: (raw: z.infer<S>) => T,
): Promise<{ ok: true; requestId: string; output: T } | { ok: false; error: CoachErrorKey }> {
  const { requestId } = call;
  const base = { promptId: call.prompt.id, input: call.input };
  let usage = { servedModel: null as string | null, inputTokens: 0, outputTokens: 0 };
  try {
    const response = await getCoachClient().beta.messages.parse({
      model: call.model,
      max_tokens: MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: call.prompt.body,
      messages: [{ role: "user", content: call.message }],
      output_config: { format: betaZodOutputFormat(schema) },
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

    const output = sanitize(response.parsed_output as z.infer<S>);
    await complete(requestId, { ...base, ...usage, status: "done", output, error: null });
    return { ok: true, requestId, output };
  } catch (error) {
    // Jetons conservés si l'appel a abouti mais que l'enregistrement a échoué
    const key = apiErrorKey(error);
    await complete(requestId, { ...base, ...usage, status: "failed", output: null,
      error: error instanceof Error ? error.message : key })
      .catch(() => undefined);
    return { ok: false, error: key };
  }
}

// ==================== RECHERCHE WEB ====================

/** Schéma JSON de l'outil soumettre_faits, tiré du schéma Zod. */
function submitInputSchema(): Anthropic.Tool.InputSchema {
  // La clé $schema n'est pas attendue par l'API : elle est retirée
  const schema: Record<string, unknown> = { ...z.toJSONSchema(researchOutputSchema) };
  delete schema.$schema;
  return schema as Anthropic.Tool.InputSchema;
}

/** Résultats de recherche contenus dans une réponse (erreurs de recherche ignorées). */
function searchHits(content: readonly Anthropic.ContentBlock[]): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const block of content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const result of block.content) {
      hits.push({ url: result.url, title: result.title, pageAge: result.page_age });
    }
  }
  return hits;
}

/** Sources aplaties pour coach_complete (une ligne par source et par fait). */
function flatSources(research: Research) {
  return research.facts.flatMap((fact, factIndex) =>
    fact.sources.map((source) => ({ factIndex, fact: fact.text, ...source })),
  );
}

/**
 * Recherche Web sourcée : le modèle cherche (outil serveur web_search), puis remet ses
 * faits avec l'outil soumettre_faits. Les pauses de l'outil serveur sont reprises
 * (MAX_CONTINUATIONS au plus) ; jetons et recherches de chaque appel sont additionnés.
 * Une source n'est gardée que si son URL figure dans les résultats renvoyés par l'API.
 *
 * @param call    - Demande réservée
 * @param stepNo  - Étape 1 (PESTEL) ou 2 (cinq forces)
 * @param maxUses - Nombre maximal de recherches, figé à la réservation
 */
async function callResearch(
  call: ModelCall,
  stepNo: StepNo,
  maxUses: number,
): Promise<CoachRunResult<"research">> {
  const { requestId } = call;
  const base = { promptId: call.prompt.id, input: call.input };
  const usage = {
    servedModel: null as string | null,
    inputTokens: 0,
    outputTokens: 0,
    webSearches: 0,
  };
  const hits: SearchHit[] = [];
  const messages: Anthropic.MessageParam[] = [
    // La recherche porte sur un gabarit : son message est toujours un texte
    { role: "user", content: call.message as string },
  ];
  const tools: Anthropic.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: maxUses,
      allowed_callers: ["direct"] },
    { name: SUBMIT_TOOL, description: "Remet les faits trouvés, avec leurs sources.",
      input_schema: submitInputSchema() },
  ];
  // Termine la demande en échec (ou refus) et renvoie la clé du message
  const fail = async (status: "failed" | "refused", error: string, key: CoachErrorKey) => {
    await complete(requestId, { ...base, ...usage, status, output: null, error });
    return { ok: false as const, error: key };
  };
  try {
    for (let turn = 0; turn <= MAX_CONTINUATIONS; turn += 1) {
      const response = await getCoachClient().messages.create({
        model: call.model,
        max_tokens: MAX_TOKENS,
        system: call.prompt.body,
        messages,
        tools,
      });
      usage.servedModel = response.model;
      usage.inputTokens += response.usage.input_tokens;
      usage.outputTokens += response.usage.output_tokens;
      usage.webSearches += response.usage.server_tool_use?.web_search_requests ?? 0;
      hits.push(...searchHits(response.content));

      if (response.stop_reason === "refusal") {
        return fail("refused", response.stop_details?.category ?? "refusal", "refused");
      }
      const submitted = response.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === "tool_use" && block.name === SUBMIT_TOOL,
      );
      if (submitted) {
        const parsed = researchOutputSchema.safeParse(submitted.input);
        if (!parsed.success) return fail("failed", "faits illisibles", "failed");
        const output = sanitizeResearch(parsed.data, stepNo, hits);
        await complete(requestId, { ...base, ...usage, status: "done", output,
          sources: flatSources(output), error: null });
        return { ok: true, requestId, output };
      }
      if (response.stop_reason !== "pause_turn") {
        const reason = response.stop_reason ?? "inconnu";
        return fail("failed", `aucun fait remis (${reason})`, "failed");
      }
      // Pause de l'outil serveur : la réponse est renvoyée telle quelle pour qu'il reprenne
      messages.push({ role: "assistant", content: response.content });
    }
    return fail("failed", "trop de reprises", "failed");
  } catch (error) {
    // Jetons et recherches déjà consommés conservés
    const key = apiErrorKey(error);
    await complete(requestId, { ...base, ...usage, status: "failed", output: null,
      error: error instanceof Error ? error.message : key })
      .catch(() => undefined);
    return { ok: false, error: key };
  }
}
