/**
 * =============================================================
 *  Fichier    : index.ts (templates)
 *  Projet     : Kalami Stratégie
 *  Description: Point d'entrée des gabarits : étapes qui en ont un, validation stricte du
 *               contenu envoyé par le navigateur avant enregistrement, liste de contrôle
 *               d'un contenu enregistré (transmise au coach pour l'évaluation).
 *               Étapes enregistrables : les gabarits, plus le plan de l'étape 9 (S8a), qui
 *               n'a ni liste de contrôle ni coach d'étape.
 *  Auteur     : Claude Marcel
 *  Version    : 1.6
 *  Date       : 2026-10-15
 *  Dépendances: templates/pestel.ts, forces.ts, internal.ts, stakeholders.ts,
 *               synthesis.ts (étape 5, S6a), direction.ts et choice.ts (étapes 6-7, S7a),
 *               action.ts (étape 8, S7b), plan.ts (étape 9, S8a)
 * =============================================================
 */

import type { z } from "zod";

import { actionChecklist, actionSchema, readAction } from "@/lib/strategy/templates/action";
import { choiceChecklist, choiceSchema, readChoice } from "@/lib/strategy/templates/choice";
import type { ChecklistItem } from "@/lib/strategy/templates/common";
import {
  directionChecklist,
  directionSchema,
  readDirection,
} from "@/lib/strategy/templates/direction";
import { forcesChecklist, forcesSchema, readForces } from "@/lib/strategy/templates/forces";
import {
  internalChecklist,
  internalSchema,
  readInternal,
} from "@/lib/strategy/templates/internal";
import { pestelChecklist, pestelSchema, readPestel } from "@/lib/strategy/templates/pestel";
import { planSchema } from "@/lib/strategy/templates/plan";
import {
  readStakeholders,
  stakeholdersChecklist,
  stakeholdersSchema,
} from "@/lib/strategy/templates/stakeholders";
import {
  readSynthesis,
  synthesisChecklist,
  synthesisSchema,
} from "@/lib/strategy/templates/synthesis";
import { PLAN_STEP, type StepNo } from "@/lib/strategy/steps";

/** Étapes dotées d'un gabarit interactif (les autres arrivent aux sprints suivants). */
export const TEMPLATE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const satisfies readonly StepNo[];

export type TemplateStep = (typeof TEMPLATE_STEPS)[number];

/** Schéma strict du contenu de chaque gabarit. */
const SCHEMAS: Record<TemplateStep, z.ZodType<Record<string, unknown>>> = {
  1: pestelSchema,
  2: forcesSchema,
  3: internalSchema,
  4: stakeholdersSchema,
  5: synthesisSchema,
  6: directionSchema,
  7: choiceSchema,
  8: actionSchema,
};

/** Vrai si l'étape a un gabarit interactif. */
export function hasTemplate(no: number): no is TemplateStep {
  return (TEMPLATE_STEPS as readonly number[]).includes(no);
}

/**
 * Valide strictement le contenu d'un gabarit avant enregistrement.
 * @param no  - Étape concernée (dotée d'un gabarit)
 * @param raw - Contenu reçu du navigateur
 * @returns Contenu validé, ou null s'il est invalide
 */
export function parsePayload(no: TemplateStep, raw: unknown): Record<string, unknown> | null {
  const parsed = SCHEMAS[no].safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Étapes dont le contenu s'enregistre (autosave, versions) : gabarits et plan. */
export type EditableStep = TemplateStep | typeof PLAN_STEP;

/** Vrai si le contenu de l'étape s'enregistre (gabarit ou plan stratégique). */
export function isEditableStep(no: number): no is EditableStep {
  return hasTemplate(no) || no === PLAN_STEP;
}

/**
 * Valide strictement le contenu d'une étape enregistrable (gabarit ou plan).
 * @param no  - Étape concernée
 * @param raw - Contenu reçu du navigateur
 * @returns Contenu validé, ou null s'il est invalide
 */
export function parseStepPayload(no: EditableStep, raw: unknown): Record<string, unknown> | null {
  if (no !== PLAN_STEP) return parsePayload(no, raw);
  const parsed = planSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * Liste de contrôle d'un contenu enregistré (clés des libellés de chaque gabarit).
 * @param no  - Étape concernée (dotée d'un gabarit)
 * @param raw - Contenu JSON de study_steps.payload
 */
export function checklistFor(no: TemplateStep, raw: unknown): ChecklistItem[] {
  switch (no) {
    case 1:
      return pestelChecklist(readPestel(raw));
    case 2:
      // Contenu jamais enregistré : le contenu de départ n'a de toute façon rien d'évalué
      return forcesChecklist(readForces(raw, "", []));
    case 3:
      return internalChecklist(readInternal(raw));
    case 4:
      return stakeholdersChecklist(readStakeholders(raw));
    case 5:
      return synthesisChecklist(readSynthesis(raw));
    case 6:
      return directionChecklist(readDirection(raw));
    case 7:
      return choiceChecklist(readChoice(raw));
    case 8:
      return actionChecklist(readAction(raw));
  }
}
