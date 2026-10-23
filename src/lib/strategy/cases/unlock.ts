/**
 * =============================================================
 *  Fichier    : unlock.ts
 *  Projet     : Kalami Stratégie
 *  Description: Règle de déverrouillage du corrigé d'un cas d'entraînement : chaque étape
 *               s'ouvre quand l'acheteur valide la même étape de son étude, le plan (9) et
 *               l'épilogue quand les étapes 1 à 8 sont validées ; tout s'ouvre si le cas a
 *               l'interrupteur « tout de suite ». La base garde les étapes ouvertes ; ces
 *               fonctions pures lisent ce qu'elle renvoie.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-23
 *  Dépendances: lib/strategy/steps.ts
 * =============================================================
 */

import { isStepNo, PLAN_STEP, type StepNo } from "@/lib/strategy/steps";

// ==================== TYPES ====================

/** Accès d'un acheteur à un cas, tel que renvoyé par practice_case_my_access. */
export type CaseAccess = {
  /** Étude préremplie, ou null tant qu'elle n'est pas ouverte. */
  studyId: string | null;
  unlockedSteps: StepNo[];
  unlockImmediately: boolean;
  source: "purchase" | "admin_grant";
};

const ALL_STEPS: StepNo[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ==================== LECTURE ====================

/**
 * Étapes ouvertes, lues dans le tableau renvoyé par la base (ordre croissant, sans
 * doublon, valeurs inconnues écartées).
 * @param raw - Valeur de la colonne unlocked_steps
 */
export function readUnlockedSteps(raw: unknown): StepNo[] {
  if (!Array.isArray(raw)) return [];
  const steps = new Set(raw.map(Number).filter(isStepNo));
  return ALL_STEPS.filter((no) => steps.has(no));
}

// ==================== RÈGLE ====================

/**
 * Étapes dont le corrigé est visible.
 * @param access - Accès de l'acheteur
 * @returns Étapes ouvertes, de 1 à 9
 *
 * Exemple :
 *   unlockedCorrections({ ...access, unlockedSteps: [1, 3] }) // [1, 3]
 */
export function unlockedCorrections(access: CaseAccess): StepNo[] {
  if (access.unlockImmediately) return ALL_STEPS;
  return access.unlockedSteps;
}

/**
 * Le corrigé d'une étape est-il visible ?
 * @param access - Accès de l'acheteur
 * @param step - Étape demandée
 */
export function isCorrectionUnlocked(access: CaseAccess, step: StepNo): boolean {
  return unlockedCorrections(access).includes(step);
}

/**
 * L'épilogue s'ouvre avec le plan.
 * @param access - Accès de l'acheteur
 */
export function isEpilogueUnlocked(access: CaseAccess): boolean {
  return isCorrectionUnlocked(access, PLAN_STEP);
}
