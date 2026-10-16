/**
 * =============================================================
 *  Fichier    : plan-actions.ts
 *  Projet     : Kalami Stratégie
 *  Description: Actions serveur du plan stratégique (S8a) : assemblage à neuf du plan entier
 *               ou d'une section depuis les étapes 5 à 8, sans IA. Rien n'est écrit ici : le
 *               plan assemblé revient au navigateur, qui l'enregistre par la sauvegarde
 *               automatique (révision, versions et droits vérifiés en SQL).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/plan-assemble.ts, lib/strategy/plan-inputs.ts, lib/auth/dal.ts
 * =============================================================
 */

"use server";

import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import { assemblePlan, assembleSection } from "@/lib/strategy/plan-assemble";
import { getPlanInputs } from "@/lib/strategy/plan-inputs";
import { PLAN_STEP } from "@/lib/strategy/steps";
import {
  PLAN_SECTIONS,
  type PlanPayload,
  type PlanSection,
  type PlanSectionKey,
} from "@/lib/strategy/templates/plan";

/**
 * Assemble le plan entier depuis les étapes (date de génération : maintenant).
 * @param studyId - Identifiant de l'étude
 * @returns Plan assemblé, ou null si l'étude est inaccessible
 */
export async function assemblePlanForStudy(studyId: string): Promise<PlanPayload | null> {
  await requireUser(`/strategie/etudes/${studyId}/etapes/${PLAN_STEP}`);
  if (!isUuid(studyId)) return null;
  const inputs = await getPlanInputs(studyId);
  return inputs ? assemblePlan(inputs, new Date()) : null;
}

/**
 * Assemble une seule section depuis les étapes.
 * @param studyId - Identifiant de l'étude
 * @param section - Clé de la section
 * @returns Section assemblée, ou null si l'étude est inaccessible ou la clé inconnue
 */
export async function assemblePlanSection(
  studyId: string,
  section: string,
): Promise<PlanSection | null> {
  await requireUser(`/strategie/etudes/${studyId}/etapes/${PLAN_STEP}`);
  if (!isUuid(studyId) || !(PLAN_SECTIONS as readonly string[]).includes(section)) return null;
  const inputs = await getPlanInputs(studyId);
  return inputs ? assembleSection(section as PlanSectionKey, inputs) : null;
}
