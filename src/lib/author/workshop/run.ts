/**
 * =============================================================
 *  Fichier    : run.ts (atelier)
 *  Projet     : Kalami
 *  Description: Déroulé serveur du relecteur et du conseiller de style de l'atelier
 *               (v0.15.1), un chapitre à la fois : propriété du livre vérifiée, estimation
 *               du coût, réservation en SQL (crédits, débit, outils activés), appel à
 *               Claude en sortie structurée, nettoyage, puis fin de la demande avec les
 *               jetons réels. Toute demande réservée est terminée, même en cas d'erreur.
 *               Fiche du livre rédigée par Claude (v0.15.2), même déroulé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-25
 *  Dépendances: @anthropic-ai/sdk, zod, coach/client.ts, workshop/queries.ts,
 *               workshop/suggestions.ts, workshop/listing.ts, lib/supabase/server.ts,
 *               lib/supabase/admin.ts
 * =============================================================
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

import { getCoachClient, isCoachConfigured } from "@/lib/strategy/coach/client";
import type { AuthorProfile } from "@/lib/author/queries";
import {
  listingMessage,
  listingOutputSchema,
  sanitizeListing,
  type Listing,
} from "@/lib/author/workshop/listing";
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

/** Consigne de la fiche du livre : rien n'est inventé, ni sur le livre ni sur l'auteur. */
const LISTING_SYSTEM = `Tu es un éditeur chargé de la fiche commerciale d'un livre numérique.
À partir de la fiche actuelle et du manuscrit, rédige dans la langue du livre :
- summary : un résumé de quatrième de couverture (120 à 250 mots) qui donne envie de lire
  sans dévoiler la fin ;
- hook : une accroche d'une ou deux phrases pour les réseaux sociaux ;
- keywords : 6 à 10 mots-clés ou expressions courtes (thèmes, genre, public), sans virgule
  ni point-virgule à l'intérieur ;
- bio : la biographie fournie par l'auteur, reformulée à la troisième personne en un court
  paragraphe. N'ajoute AUCUN fait (diplôme, prix, lieu, métier, âge) absent de la
  biographie fournie. Si aucune biographie n'est fournie, renvoie une chaîne vide ;
- titles : 3 à 5 propositions de titre, chacune avec un sous-titre (chaîne vide si inutile).
Reste fidèle au contenu réel du livre : n'invente ni personnage, ni événement, ni chiffre.
Si seul le début du manuscrit est fourni, ne présume pas de la suite.`;

// ==================== TYPES ====================

/** Outils de l'atelier (colonne tool des demandes). */
export type WorkshopTool = ChapterTool | "listing";

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

export type ListingRunResult =
  | { ok: true; requestId: string; listing: Listing }
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

// ==================== DÉROULÉ COMMUN ====================

type CallResult<T> =
  | { ok: true; requestId: string; value: T }
  | { ok: false; error: WorkshopErrorKey };

/** Réservation : livre, version lue, chapitre facultatif et outil. */
type ReserveTarget = {
  bookId: string;
  versionId: string;
  chapterId: string | null;
  tool: WorkshopTool;
};

/**
 * Réserve une demande (session de l'auteur : propriété, crédits et débit vérifiés en SQL),
 * appelle Claude en sortie structurée, nettoie la réponse et termine la demande, même en
 * cas d'erreur.
 * @param target   - Livre, version, chapitre facultatif et outil
 * @param prompt   - Consigne, message et schéma de sortie
 * @param input    - Résumé de l'entrée conservé avec la demande
 * @param sanitize - Nettoyage de la sortie validée
 */
async function reserveAndCall<S extends z.ZodType, T>(
  target: ReserveTarget,
  prompt: { system: string; message: string; schema: S },
  input: unknown,
  sanitize: (output: z.infer<S>) => T,
): Promise<CallResult<T>> {
  const prices = await currentPrices();
  if (!prices) return { ok: false, error: "failed" };
  const chars = prompt.system.length + prompt.message.length;
  const estimate = estimateCost(chars, prices.input, prices.output);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("workshop_reserve", {
    p_book_id: target.bookId,
    p_version_id: target.versionId,
    p_chapter_id: target.chapterId,
    p_tool: target.tool,
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
  let usage = { servedModel: null as string | null, inputTokens: 0, outputTokens: 0 };
  try {
    const response = await getCoachClient().beta.messages.parse({
      model: reservation.model,
      max_tokens: MAX_TOKENS,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: prompt.system,
      messages: [{ role: "user", content: prompt.message }],
      output_config: { format: betaZodOutputFormat(prompt.schema) },
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

    const value = sanitize(response.parsed_output as z.infer<S>);
    await complete(requestId, { ...usage, input, status: "done", output: value, error: null });
    return { ok: true, requestId, value };
  } catch (caught) {
    // Jetons conservés si l'appel a abouti mais que l'enregistrement a échoué
    const key = apiErrorKey(caught);
    await complete(requestId, { ...usage, input, status: "failed", output: null,
      error: caught instanceof Error ? caught.message : key })
      .catch(() => undefined);
    return { ok: false, error: key };
  }
}

// ==================== RELECTURE D'UN CHAPITRE ====================

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

  const result = await reserveAndCall(
    { bookId, versionId: manuscript.versionId, chapterId, tool },
    { system: SYSTEM[tool], message, schema: chapterOutputSchema },
    { chapterTitle: chapter.title, blocks: chapter.blocks.length },
    (output) => sanitizeChapterOutput(output, chapter.blocks, tool),
  );
  return result.ok ? { ok: true, requestId: result.requestId, review: result.value } : result;
}

// ==================== FICHE DU LIVRE ====================

/**
 * Lance la rédaction de la fiche (résumé, accroche, mots-clés, biographie, titres).
 * @param bookId - Livre (uuid validé)
 * @param author - Fiche auteur de l'utilisateur connecté (nom et biographie)
 * @returns La fiche nettoyée, ou une clé d'erreur
 */
export async function runListingTool(
  bookId: string,
  author: Pick<AuthorProfile, "id" | "display_name" | "bio">,
): Promise<ListingRunResult> {
  if (!isCoachConfigured()) return { ok: false, error: "not_configured" };
  const manuscript = await getManuscript(bookId, author.id);
  if (!manuscript?.versionId) return { ok: false, error: "not_found" };
  if (manuscript.chapters.length === 0) return { ok: false, error: "empty_chapter" };

  const { book } = manuscript;
  const message = listingMessage({
    title: book.title,
    subtitle: book.subtitle,
    summary: book.summary,
    keywords: book.keywords,
    language: book.language,
    authorName: author.display_name,
    bio: author.bio,
    chapters: manuscript.chapters,
  });

  const result = await reserveAndCall(
    { bookId, versionId: manuscript.versionId, chapterId: null, tool: "listing" },
    { system: LISTING_SYSTEM, message, schema: listingOutputSchema },
    { chapters: manuscript.chapters.length, chars: message.length },
    sanitizeListing,
  );
  return result.ok ? { ok: true, requestId: result.requestId, listing: result.value } : result;
}
