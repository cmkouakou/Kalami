/**
 * =============================================================
 *  Fichier    : schemas.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Forme de la réponse du coach. Le schéma envoyé à l'API reste sans bornes
 *               (les sorties structurées n'acceptent pas les contraintes de longueur) ;
 *               le nettoyage qui suit tronque, limite et écarte les codes de règle inconnus.
 *               Utilisable côté client (lecture d'une relecture enregistrée).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-13
 *  Dépendances: zod
 * =============================================================
 */

import { z } from "zod";

// ==================== CONSTANTES ====================

export const MAX_SUGGESTIONS = 12;
const MAX_SUMMARY = 1500;
const MAX_TITLE = 200;
const MAX_EXPLANATION = 2000;
const MAX_PROPOSAL = 2000;
const FIELD_PATTERN = /^[a-zA-Z]{1,40}$/;
const ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/;

// ==================== SCHÉMA ENVOYÉ À L'API ====================

/** Réponse brute attendue du modèle (relecture). */
export const reviewOutputSchema = z.object({
  summary: z.string(),
  suggestions: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
      ruleCode: z.string().nullable(),
      targetId: z.string().nullable(),
      field: z.string().nullable(),
      proposal: z.string().nullable(),
    }),
  ),
});

export type ReviewOutput = z.infer<typeof reviewOutputSchema>;

/** Suggestion nettoyée, telle qu'enregistrée et affichée. */
export type Suggestion = ReviewOutput["suggestions"][number];

/** Relecture nettoyée. */
export type Review = { summary: string; suggestions: Suggestion[] };

// ==================== NETTOYAGE ====================

/** Coupe un texte trop long et retire les espaces superflus. */
function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Nettoie une relecture produite par le modèle.
 *
 * Les suggestions sans titre ni explication sont écartées ; un code de règle inconnu, un
 * identifiant ou un champ mal formé est mis à null ; une proposition n'est conservée que si
 * elle vise un élément et un champ précis.
 *
 * @param raw        - Réponse validée par reviewOutputSchema
 * @param ruleCodes  - Codes des règles transmises au modèle
 * @returns Relecture prête à enregistrer
 */
export function sanitizeReview(raw: ReviewOutput, ruleCodes: readonly string[]): Review {
  const suggestions = raw.suggestions
    .map((item): Suggestion => {
      const targetId = item.targetId && ID_PATTERN.test(item.targetId) ? item.targetId : null;
      const field = item.field && FIELD_PATTERN.test(item.field) ? item.field : null;
      const proposal = item.proposal?.trim() ? clip(item.proposal, MAX_PROPOSAL) : null;
      const precise = Boolean(targetId && field && proposal);
      return {
        title: clip(item.title, MAX_TITLE),
        explanation: clip(item.explanation, MAX_EXPLANATION),
        ruleCode: item.ruleCode && ruleCodes.includes(item.ruleCode) ? item.ruleCode : null,
        targetId: precise ? targetId : null,
        field: precise ? field : null,
        proposal: precise ? proposal : null,
      };
    })
    .filter((item) => item.title || item.explanation)
    .slice(0, MAX_SUGGESTIONS);

  return { summary: clip(raw.summary, MAX_SUMMARY), suggestions };
}

/**
 * Relit une relecture enregistrée en base (colonne output) ; null si elle est illisible.
 * @param raw - Valeur JSON lue en base
 */
export function readReview(raw: unknown): Review | null {
  const parsed = reviewOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { summary: parsed.data.summary, suggestions: parsed.data.suggestions };
}
