/**
 * =============================================================
 *  Fichier    : run.ts (atelier)
 *  Projet     : Kalami
 *  Description: Déroulé serveur du relecteur et du conseiller de style de l'atelier
 *               (v0.15.1), un chapitre à la fois : propriété du livre vérifiée, estimation
 *               du coût, réservation en SQL (crédits, débit, outils activés), appel à
 *               Claude en sortie structurée, nettoyage, puis fin de la demande avec les
 *               jetons réels. Toute demande réservée est terminée, même en cas d'erreur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-25
 *  Dépendances: @anthropic-ai/sdk, coach/client.ts, workshop/queries.ts,
 *               workshop/suggestions.ts, lib/supabase/server.ts, lib/supabase/admin.ts
 * =============================================================
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { getCoachClient, isCoachConfigured } from "@/lib/strategy/coach/client";
import { getManuscript } from "@/lib/author/workshop/queries";
import {
  chapterMessage,
  chapterOutputSchema,
  sanitizeChapterOutput,
  type ChapterReview,
  type ChapterTool,
} from "@/lib/author/workshop/suggestions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ==================== CONSTANTES ====================

/** Plafond de jetons de sortie d'une demande. */
export const MAX_TOKENS = 16_000;

/** Approximation prudente : un jeton pour trois caractères de français. */
export const CHARS_PER_TOKEN = 3;

/** Au-delà, le chapitre est trop long pour une seule demande. */
export const MAX_CHAPTER_CHARS = 120_000;

/** En-tête bêta du repli automatique vers un autre modèle (forme « default »). */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Règles communes : la voix de l'auteur prime, l'extrait doit être recopié à l'identique. */
const COMMON_RULES = `
Le texte est fourni en blocs numérotés [n] (paragraphes, titres, citations).
Pour chaque suggestion, indique :
- block : le numéro du bloc ;
- original : un extrait recopié EXACTEMENT depuis ce bloc (mêmes mots, même ponctuation),
  assez long pour être unique dans le bloc, sans jamais déborder sur un autre bloc ;
- replacement : le même extrait corrigé ;
- kind : le type de suggestion ;
- explanation : une explication brève et bienveillante, en français.
Respecte la voix, le ton, le registre et les choix narratifs de l'auteur : dialogues
familiers, régionalismes et effets de style voulus ne sont pas des fautes.
Ne réécris jamais un paragraphe entier. N'invente aucun contenu.
Résume en deux ou trois phrases (summary) l'état général du chapitre.
Si le texte est en anglais, applique les règles de l'anglais et écris tout de même tes
explications en français.`;

/** Consigne de chaque outil. */
const SYSTEM: Record<ChapterTool, string> = {
  proofread: `Tu es un correcteur professionnel de l'édition francophone.
Relève les fautes d'orthographe, de grammaire, d'accord, de conjugaison et de ponctuation,
ainsi que les écarts de typographie française (espaces avant ; : ! ?, guillemets « »).
Types permis (kind) : spelling, grammar, agreement, punctuation, typography, other.
Ne propose aucun changement de style : seulement des corrections certaines.
${COMMON_RULES}`,
  style: `Tu es un éditeur littéraire bienveillant.
Repère ce qui gêne la lecture : répétitions rapprochées, phrases trop longues ou confuses,
rythme haché, mots imprécis ou lourds. Propose une reformulation sobre et limitée à
l'extrait. Laisse les fautes d'orthographe au correcteur.
Types permis (kind) : repetition, long_sentence, clarity, rhythm, word_choice, other.
Limite-toi aux suggestions les plus utiles (une quarantaine au plus).
${COMMON_RULES}`,
};

// ==================== TYPES ====================

/** Clés d'erreur de l'atelier (fr-workshop.ts, tools.errors). */
export type WorkshopErrorKey =
  | "not_configured"
  | "not_found"
  | "empty_chapter"
  | "chapter_too_long"
  | "workshop_disabled"
  | "workshop_locked"
  | "rate_limited"
  | "budget_exhausted"
  | "refused"
  | "timeout"
  | "busy"
  | "failed";

export type WorkshopRunResult =
  | { ok: true; requestId: string; review: ChapterReview }
  | { ok: false; error: WorkshopErrorKey };

type Reservation = {
  request_id: string | null;
  refusal: string | null;
  model: string | null;
  input_price: number | null;
  output_price: number | null;
};

const REFUSALS: readonly WorkshopErrorKey[] = [
  "workshop_disabled", "workshop_locked", "rate_limited", "budget_exhausted",
];

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

/** Traduit une erreur de l'API en clé de message. */
function apiErrorKey(error: unknown): WorkshopErrorKey {
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "timeout";
  if (error instanceof Anthropic.RateLimitError) return "busy";
  if (error instanceof Anthropic.APIError && error.status === 529) return "busy";
  return "failed";
}

/** Prix en vigueur, lus sans réserver (pour estimer avant la réservation). */
async function currentPrices(): Promise<{ input: number; output: number } | null> {
  const { data } = await createAdminClient()
    .from("workshop_settings")
    .select("input_price, output_price")
    .maybeSingle<{ input_price: number; output_price: number }>();
  if (!data) return null;
  return { input: Number(data.input_price), output: Number(data.output_price) };
}

/** Termine une demande réservée (rôle service seulement). */
async function complete(
  requestId: string,
  values: {
    status: "done" | "failed" | "refused";
    servedModel: string | null;
    inputTokens: number;
    outputTokens: number;
    input: unknown;
    output: unknown;
    error: string | null;
  },
): Promise<void> {
  const { error } = await createAdminClient().rpc("workshop_complete", {
    p_request_id: requestId,
    p_status: values.status,
    p_served_model: values.servedModel,
    p_input_tokens: values.inputTokens,
    p_output_tokens: values.outputTokens,
    p_input: values.input,
    p_output: values.output,
    p_error: values.error ? values.error.slice(0, 500) : null,
  });
  if (error) throw new Error(`workshop_complete : ${error.message}`);
}

// ==================== DÉROULÉ ====================

/**
 * Lance le relecteur ou le conseiller de style sur un chapitre d'un livre de l'auteur.
 * @param bookId    - Livre (uuid validé)
 * @param chapterId - Chapitre de la version lue (en attente, sinon publiée)
 * @param tool      - proofread ou style
 * @param authorId  - Fiche auteur de l'utilisateur connecté
 * @returns La revue nettoyée, ou une clé d'erreur
 */
export async function runChapterTool(
  bookId: string,
  chapterId: string,
  tool: ChapterTool,
  authorId: string,
): Promise<WorkshopRunResult> {
  if (!isCoachConfigured()) return { ok: false, error: "not_configured" };
  const manuscript = await getManuscript(bookId, authorId);
  const chapter = manuscript?.chapters.find((item) => item.id === chapterId);
  if (!manuscript?.versionId || !chapter) return { ok: false, error: "not_found" };

  const message = chapterMessage(chapter.title, chapter.blocks);
  if (chapter.blocks.length === 0) return { ok: false, error: "empty_chapter" };
  if (message.length > MAX_CHAPTER_CHARS) return { ok: false, error: "chapter_too_long" };

  const prices = await currentPrices();
  if (!prices) return { ok: false, error: "failed" };
  const system = SYSTEM[tool];
  const estimate = estimateCost(system.length + message.length, prices.input, prices.output);

  // Réservation avec la session de l'auteur : propriété, crédits et débit vérifiés en SQL
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("workshop_reserve", {
    p_book_id: bookId,
    p_version_id: manuscript.versionId,
    p_chapter_id: chapterId,
    p_tool: tool,
    p_estimate: Number(estimate.toFixed(6)),
  });
  if (error) return { ok: false, error: error.code === "42501" ? "not_found" : "failed" };
  const reservation = (data as Reservation[] | null)?.[0];
  if (reservation?.refusal) {
    const refusal = reservation.refusal as WorkshopErrorKey;
    return { ok: false, error: REFUSALS.includes(refusal) ? refusal : "failed" };
  }
  if (!reservation?.request_id || !reservation.model) return { ok: false, error: "failed" };

  const requestId = reservation.request_id;
  const input = { chapterTitle: chapter.title, blocks: chapter.blocks.length };
  let usage = { servedModel: null as string | null, inputTokens: 0, outputTokens: 0 };
  try {
    const response = await getCoachClient().beta.messages.parse({
      model: reservation.model,
      max_tokens: MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: message }],
      output_config: { format: betaZodOutputFormat(chapterOutputSchema) },
    });
    usage = {
      servedModel: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };

    if (response.stop_reason === "refusal") {
      await complete(requestId, { ...usage, input, status: "refused", output: null,
        error: response.stop_details?.category ?? "refusal" });
      return { ok: false, error: "refused" };
    }
    if (!response.parsed_output) {
      await complete(requestId, { ...usage, input, status: "failed", output: null,
        error: `sortie illisible (${response.stop_reason ?? "inconnu"})` });
      return { ok: false, error: "failed" };
    }

    const review = sanitizeChapterOutput(response.parsed_output, chapter.blocks, tool);
    await complete(requestId, { ...usage, input, status: "done", output: review, error: null });
    return { ok: true, requestId, review };
  } catch (caught) {
    // Jetons conservés si l'appel a abouti mais que l'enregistrement a échoué
    const key = apiErrorKey(caught);
    await complete(requestId, { ...usage, input, status: "failed", output: null,
      error: caught instanceof Error ? caught.message : key })
      .catch(() => undefined);
    return { ok: false, error: key };
  }
}
