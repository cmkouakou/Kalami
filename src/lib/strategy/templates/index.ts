/**
 * =============================================================
 *  Fichier    : index.ts (templates)
 *  Projet     : Kalami Stratégie
 *  Description: Point d'entrée des gabarits : étapes qui en ont un, validation stricte du
 *               contenu envoyé par le navigateur avant enregistrement, liste de contrôle
 *               d'un contenu enregistré (transmise au coach pour l'évaluation).
 *  Auteur     : Claude Marcel
 *  Version    : 1.5
 *  Date       : 2026-10-15
 *  Dépendances: templates/pestel.ts, forces.ts, internal.ts, stakeholders.ts,
 *               synthesis.ts (étape 5, S6a), direction.ts et choice.ts (étapes 6-7, S7a),
 *               action.ts (étape 8, S7b)
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
import type { StepNo } from "@/lib/strategy/steps";

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
