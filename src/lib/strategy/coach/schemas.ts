/**
 * =============================================================
 *  Fichier    : schemas.ts (coach)
 *  Projet     : Kalami Stratégie
 *  Description: Forme des réponses du coach : relecture, questions d'approfondissement (S4b)
 *               et évaluation sur 100 avec quatre critères (S4b). Le schéma envoyé à l'API
 *               reste sans bornes (les sorties structurées n'acceptent pas ces contraintes) ;
 *               le nettoyage qui suit tronque, borne, limite et écarte les codes de règle
 *               inconnus. Utilisable côté client (lecture d'un résultat enregistré).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
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
export const MAX_QUESTIONS = 8;
export const MAX_IMPROVEMENTS = 8;
const MAX_STRENGTHS = 3;
const MAX_QUESTION = 500;
const MAX_WHY = 1000;
const MAX_COMMENT = 600;
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

// ==================== QUESTIONS D'APPROFONDISSEMENT ====================

/** Réponse brute attendue du modèle (questions). */
export const deepenOutputSchema = z.object({
  intro: z.string(),
  questions: z.array(z.object({ question: z.string(), why: z.string() })),
});

export type DeepenOutput = z.infer<typeof deepenOutputSchema>;

/** Questions nettoyées. */
export type Deepen = DeepenOutput;

/**
 * Nettoie les questions produites par le modèle : textes coupés, questions vides écartées,
 * nombre limité.
 * @param raw - Réponse validée par deepenOutputSchema
 */
export function sanitizeDeepen(raw: DeepenOutput): Deepen {
  const questions = raw.questions
    .map((item) => ({ question: clip(item.question, MAX_QUESTION), why: clip(item.why, MAX_WHY) }))
    .filter((item) => item.question)
    .slice(0, MAX_QUESTIONS);
  return { intro: clip(raw.intro, MAX_SUMMARY), questions };
}

/**
 * Relit des questions enregistrées ; null si elles sont illisibles.
 * @param raw - Valeur JSON lue en base
 */
export function readDeepen(raw: unknown): Deepen | null {
  const parsed = deepenOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

// ==================== ÉVALUATION ====================

/** Critères de l'évaluation, dans l'ordre d'affichage. */
export const SCORE_CRITERIA = ["completeness", "precision", "rules", "coherence"] as const;
export type ScoreCriterion = (typeof SCORE_CRITERIA)[number];

/** Réponse brute attendue du modèle (évaluation). */
export const scoreOutputSchema = z.object({
  summary: z.string(),
  score: z.number(),
  criteria: z.array(
    z.object({ key: z.enum(SCORE_CRITERIA), score: z.number(), comment: z.string() }),
  ),
  strengths: z.array(z.string()),
  improvements: z.array(
    z.object({ title: z.string(), explanation: z.string(), ruleCode: z.string().nullable() }),
  ),
});

export type ScoreOutput = z.infer<typeof scoreOutputSchema>;

/** Évaluation nettoyée. */
export type Score = ScoreOutput;

/** Note entière bornée entre 0 et 100. */
function bound(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

/**
 * Nettoie une évaluation produite par le modèle : notes bornées et arrondies, un seul
 * commentaire par critère (dans l'ordre de SCORE_CRITERIA), points vides écartés, codes de
 * règle inconnus mis à null.
 * @param raw       - Réponse validée par scoreOutputSchema
 * @param ruleCodes - Codes des règles transmises au modèle
 */
export function sanitizeScore(raw: ScoreOutput, ruleCodes: readonly string[]): Score {
  const criteria = SCORE_CRITERIA.flatMap((key) => {
    const item = raw.criteria.find((criterion) => criterion.key === key);
    if (!item) return [];
    return [{ key, score: bound(item.score), comment: clip(item.comment, MAX_COMMENT) }];
  });
  const improvements = raw.improvements
    .map((item) => ({
      title: clip(item.title, MAX_TITLE),
      explanation: clip(item.explanation, MAX_EXPLANATION),
      ruleCode: item.ruleCode && ruleCodes.includes(item.ruleCode) ? item.ruleCode : null,
    }))
    .filter((item) => item.title || item.explanation)
    .slice(0, MAX_IMPROVEMENTS);
  const strengths = raw.strengths
    .map((item) => clip(item, MAX_EXPLANATION))
    .filter(Boolean)
    .slice(0, MAX_STRENGTHS);
  return {
    summary: clip(raw.summary, MAX_SUMMARY),
    score: bound(raw.score),
    criteria,
    strengths,
    improvements,
  };
}

/**
 * Relit une évaluation enregistrée ; null si elle est illisible.
 * @param raw - Valeur JSON lue en base
 */
export function readScore(raw: unknown): Score | null {
  const parsed = scoreOutputSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
