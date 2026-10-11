/**
 * =============================================================
 *  Fichier    : steps.ts
 *  Projet     : Kalami Stratégie
 *  Description: Graphe des 9 étapes de la démarche (miroir de la table strategy_steps) et
 *               règles pures : prérequis manquants, étapes en aval, progression. Utilisé
 *               pour l'affichage ; la base applique les mêmes règles à l'écriture.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-11
 * =============================================================
 */

// ==================== TYPES ====================

export type StepNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StepPhase = "understand" | "synthesize" | "decide" | "act";

export type StepStatus = "todo" | "in_progress" | "submitted" | "validated" | "needs_review";

export type StudyRole = "owner" | "contributor" | "observer";

export type StepDefinition = {
  no: StepNo;
  key: string;
  /** Module du livre correspondant. */
  module: number;
  phase: StepPhase;
  prerequisites: StepNo[];
  /** L'étape exige un profil d'entreprise complet. */
  requiresProfile: boolean;
};

// ==================== RÉFÉRENCE ====================

/** Construit une définition d'étape (forme compacte). */
function step(
  no: StepNo,
  key: string,
  module: number,
  phase: StepPhase,
  prerequisites: StepNo[],
  requiresProfile = false,
): StepDefinition {
  return { no, key, module, phase, prerequisites, requiresProfile };
}

/** Démarche en une page du livre (cahier des charges §3.3). */
export const STEPS: readonly StepDefinition[] = [
  step(1, "external", 2, "understand", [], true),
  step(2, "competitive", 3, "understand", [], true),
  step(3, "internal", 4, "understand", [], true),
  step(4, "stakeholders", 6, "understand", [], true),
  step(5, "synthesis", 5, "synthesize", [1, 2, 3, 4]),
  step(6, "direction", 7, "decide", [5]),
  step(7, "choice", 8, "decide", [6]),
  step(8, "action", 9, "act", [7]),
  step(9, "plan", 10, "act", [8]),
];

export const PHASES: readonly StepPhase[] = ["understand", "synthesize", "decide", "act"];

/** Étape du plan stratégique : générée (S8), jamais validée à la main. */
export const PLAN_STEP: StepNo = 9;

/** Marqueur « profil incomplet » dans une liste de prérequis manquants (comme en SQL). */
export const PROFILE_PREREQUISITE = 0;

// ==================== FONCTIONS ====================

/** Vrai si la valeur est un numéro d'étape valide (1 à 9). */
export function isStepNo(value: unknown): value is StepNo {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 9;
}

/** Définition d'une étape. */
export function getStep(no: StepNo): StepDefinition {
  return STEPS[no - 1];
}

/**
 * Prérequis manquants d'une étape ; 0 = profil incomplet.
 * @param no              - Étape examinée
 * @param statuses        - Statut de chaque étape de l'étude
 * @param profileComplete - Le profil contient les réponses indispensables
 * @returns Liste triée (0 d'abord), vide si l'étape est ouverte
 */
export function missingPrerequisites(
  no: StepNo,
  statuses: Partial<Record<StepNo, StepStatus>>,
  profileComplete: boolean,
): number[] {
  const step = getStep(no);
  const missing: number[] = step.requiresProfile && !profileComplete ? [PROFILE_PREREQUISITE] : [];
  for (const pre of step.prerequisites) {
    if (statuses[pre] !== "validated") missing.push(pre);
  }
  return missing;
}

/**
 * Étapes en aval (directes et indirectes), dans l'ordre de la démarche.
 * Ce sont celles qui passent « à revoir » quand l'étape est modifiée après validation.
 * @param no - Étape modifiée
 */
export function downstreamSteps(no: StepNo): StepNo[] {
  const found = new Set<StepNo>();
  const queue: StepNo[] = [no];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const step of STEPS) {
      if (step.prerequisites.includes(current) && !found.has(step.no)) {
        found.add(step.no);
        queue.push(step.no);
      }
    }
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Statuts après réouverture d'une étape validée (même règle que strategy_reopen_step).
 * @param no       - Étape rouverte
 * @param statuses - Statuts actuels
 * @returns Nouveaux statuts
 */
export function statusesAfterReopen(
  no: StepNo,
  statuses: Record<StepNo, StepStatus>,
): Record<StepNo, StepStatus> {
  if (statuses[no] !== "validated") return statuses;
  const next = { ...statuses, [no]: "in_progress" as StepStatus };
  for (const down of downstreamSteps(no)) {
    if (next[down] !== "todo") next[down] = "needs_review";
  }
  return next;
}

/** Nombre d'étapes validées (sur 9). */
export function validatedCount(statuses: Partial<Record<StepNo, StepStatus>>): number {
  return STEPS.filter((step) => statuses[step.no] === "validated").length;
}

/** Vrai si le rôle permet de modifier le contenu (profil, étapes). */
export function canEdit(role: StudyRole | null): boolean {
  return role === "owner" || role === "contributor";
}

/** Vrai si le rôle permet de valider une étape. */
export function canValidate(role: StudyRole | null): boolean {
  return role === "owner";
}
