/**
 * =============================================================
 *  Fichier    : choice.ts
 *  Projet     : Kalami Stratégie
 *  Description: Gabarit de l'étape 7, « Choix » (cahier des charges §5.8) : position dans les
 *               stratégies génériques de Porter, options placées dans les cases d'Ansoff et
 *               évaluées sur la pertinence, l'acceptabilité et la faisabilité (oui / partiel /
 *               non), décision de l'équipe, énoncé de la stratégie retenue et renoncements.
 *               Schéma Zod, lecture tolérante, alertes et liste de contrôle (miroir de
 *               strategy_checklist_ok).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: zod, templates/common.ts
 * =============================================================
 */

import { z } from "zod";

import {
  asObject,
  freeText,
  itemId,
  readList,
  type ChecklistItem,
} from "@/lib/strategy/templates/common";

// ==================== RÉFÉRENCES ====================

/**
 * Stratégies génériques de Porter : avantage (coûts ou différenciation) × cible (large ou
 * étroite).
 */
export const GENERIC_POSITIONS = [
  "cost",
  "differentiation",
  "focusCost",
  "focusDifferentiation",
] as const;

export type GenericPosition = (typeof GENERIC_POSITIONS)[number];

/** Cases d'Ansoff : produits actuels ou nouveaux × marchés actuels ou nouveaux. */
export const ANSOFF_CELLS = [
  "penetration",
  "productDevelopment",
  "marketDevelopment",
  "diversification",
] as const;

export type AnsoffCell = (typeof ANSOFF_CELLS)[number];

/** Critères d'évaluation d'une option. */
export const CRITERIA = ["relevance", "acceptability", "feasibility"] as const;

export type Criterion = (typeof CRITERIA)[number];

export const RATINGS = ["yes", "partial", "no"] as const;

export type Rating = (typeof RATINGS)[number];

export const DECISIONS = ["retained", "rejected"] as const;

export type Decision = (typeof DECISIONS)[number];

export const OPTIONS_MAX = 15;
/** Nombre d'options évaluées attendues (choisi par l'auteur). */
export const OPTIONS_MIN = 2;
export const RENUNCIATIONS_MAX = 15;
export const OPTION_TEXT_MAX = 500;
export const COMMENT_MAX = 1000;
export const JUSTIFICATION_MAX = 1500;
export const STATEMENT_MAX = 2000;
export const RENUNCIATION_MAX = 300;
export const ISSUE_LINKS_MAX = 3;

// ==================== SCHÉMAS ====================

const genericSchema = z.object({
  id: z.literal("generic"),
  position: z.enum(GENERIC_POSITIONS).nullable(),
  justification: freeText(JUSTIFICATION_MAX),
});

export type GenericChoice = z.infer<typeof genericSchema>;

const rating = z.enum(RATINGS).nullable();

const optionSchema = z.object({
  id: itemId,
  text: freeText(OPTION_TEXT_MAX),
  ansoff: z.enum(ANSOFF_CELLS).nullable(),
  relevance: rating,
  acceptability: rating,
  feasibility: rating,
  comment: freeText(COMMENT_MAX),
  decision: z.enum(DECISIONS).nullable(),
  /** Enjeux de l'étape 5 auxquels l'option répond (critère de pertinence). */
  issueLinks: z.array(itemId).max(ISSUE_LINKS_MAX),
});

export type StrategicOption = z.infer<typeof optionSchema>;

const renunciationSchema = z.object({
  id: itemId,
  text: freeText(RENUNCIATION_MAX),
});

export type Renunciation = z.infer<typeof renunciationSchema>;

export const choiceSchema = z.object({
  generic: genericSchema,
  options: z.array(optionSchema).max(OPTIONS_MAX),
  statement: z.object({ id: z.literal("statement"), text: freeText(STATEMENT_MAX) }),
  renunciations: z.array(renunciationSchema).max(RENUNCIATIONS_MAX),
});

export type ChoicePayload = z.infer<typeof choiceSchema>;

// ==================== CONTENU VIDE ====================

/** Position générique pas encore choisie. */
function emptyGeneric(): GenericChoice {
  return { id: "generic", position: null, justification: "" };
}

/** Gabarit vide (étape jamais enregistrée). */
export function emptyChoice(): ChoicePayload {
  return {
    generic: emptyGeneric(),
    options: [],
    statement: { id: "statement", text: "" },
    renunciations: [],
  };
}

/** Nouvelle option vide, non évaluée. */
export function newOption(id: string, ansoff: AnsoffCell | null = null): StrategicOption {
  return {
    id,
    text: "",
    ansoff,
    relevance: null,
    acceptability: null,
    feasibility: null,
    comment: "",
    decision: null,
    issueLinks: [],
  };
}

/** Nouveau renoncement vide. */
export function newRenunciation(id: string): Renunciation {
  return { id, text: "" };
}

// ==================== LECTURE ====================

/**
 * Relit le contenu enregistré ; les éléments invalides sont écartés.
 * @param raw - Contenu JSON de study_steps.payload
 */
export function readChoice(raw: unknown): ChoicePayload {
  const source = asObject(raw);
  const generic = genericSchema.safeParse(source.generic);
  const statement = asObject(source.statement).text;
  return {
    generic: generic.success ? generic.data : emptyGeneric(),
    options: readList(source.options, optionSchema, OPTIONS_MAX),
    statement: {
      id: "statement",
      text: typeof statement === "string" ? statement.slice(0, STATEMENT_MAX) : "",
    },
    renunciations: readList(source.renunciations, renunciationSchema, RENUNCIATIONS_MAX),
  };
}

// ==================== ÉVALUATION ====================

/** Vrai si le texte contient autre chose que des espaces. */
function filled(text: string): boolean {
  return text.trim().length > 0;
}

/** Vrai si l'option est rédigée et notée sur les trois critères. */
export function isEvaluated(option: StrategicOption): boolean {
  return filled(option.text) && CRITERIA.every((criterion) => option[criterion] !== null);
}

/** Critères notés « non » pour une option. */
export function failedCriteria(option: StrategicOption): Criterion[] {
  return CRITERIA.filter((criterion) => option[criterion] === "no");
}

/** Alerte affichée sur une option retenue : un critère à « non », ou aucun enjeu lié. */
export type OptionWarning = "failedCriterion" | "noIssue";

/**
 * Alertes d'une option retenue (l'équipe reste libre de sa décision).
 * @param option - Option évaluée
 * @returns Alertes, vide si l'option n'est pas retenue
 */
export function optionWarnings(option: StrategicOption): OptionWarning[] {
  if (option.decision !== "retained") return [];
  const warnings: OptionWarning[] = [];
  if (failedCriteria(option).length > 0) warnings.push("failedCriterion");
  if (option.issueLinks.length === 0) warnings.push("noIssue");
  return warnings;
}

// ==================== LISTE DE CONTRÔLE ====================

export type ChoiceChecklistKey =
  | "generic"
  | "options"
  | "retained"
  | "statement"
  | "renunciations";

/**
 * Liste de contrôle : position générique choisie, au moins OPTIONS_MIN options évaluées,
 * au moins une option rédigée retenue, énoncé de la stratégie, au moins un renoncement.
 */
export function choiceChecklist(payload: ChoicePayload): ChecklistItem<ChoiceChecklistKey>[] {
  return [
    { key: "generic", ok: payload.generic.position !== null },
    { key: "options", ok: payload.options.filter(isEvaluated).length >= OPTIONS_MIN },
    {
      key: "retained",
      ok: payload.options.some((option) => option.decision === "retained" && filled(option.text)),
    },
    { key: "statement", ok: filled(payload.statement.text) },
    { key: "renunciations", ok: payload.renunciations.some((item) => filled(item.text)) },
  ];
}
