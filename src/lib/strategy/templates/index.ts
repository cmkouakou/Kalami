/**
 * =============================================================
 *  Fichier    : index.ts (templates)
 *  Projet     : Kalami Stratégie
 *  Description: Point d'entrée des gabarits : étapes qui en ont un, validation stricte du
 *               contenu envoyé par le navigateur avant enregistrement.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-11
 *  Dépendances: templates/pestel.ts, forces.ts, internal.ts, stakeholders.ts
 * =============================================================
 */

import type { z } from "zod";

import { forcesSchema } from "@/lib/strategy/templates/forces";
import { internalSchema } from "@/lib/strategy/templates/internal";
import { pestelSchema } from "@/lib/strategy/templates/pestel";
import { stakeholdersSchema } from "@/lib/strategy/templates/stakeholders";
import type { StepNo } from "@/lib/strategy/steps";

/** Étapes dotées d'un gabarit interactif (les autres arrivent aux sprints suivants). */
export const TEMPLATE_STEPS = [1, 2, 3, 4] as const satisfies readonly StepNo[];

export type TemplateStep = (typeof TEMPLATE_STEPS)[number];

/** Schéma strict du contenu de chaque gabarit. */
const SCHEMAS: Record<TemplateStep, z.ZodType<Record<string, unknown>>> = {
  1: pestelSchema,
  2: forcesSchema,
  3: internalSchema,
  4: stakeholdersSchema,
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
