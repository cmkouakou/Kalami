/**
 * =============================================================
 *  Fichier    : lecons.ts (quiz)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Leçon(s) du module que couvre chaque question de quiz (v0.50.0), et
 *               choix des leçons à revoir après des échecs répétés : les questions
 *               manquées désignent les leçons mal comprises, avec un lien pour y
 *               retourner. Contenu côté serveur, comme les quiz.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-21
 *  Dépendances: lib/cours/modules.ts
 * =============================================================
 */

import { MODULES, adresseLecon } from "@/lib/cours/modules";

// ==================== RÉGLAGES ====================

/** Nombre d'essais échoués à partir duquel le quiz renvoie vers les leçons à revoir. */
export const ESSAIS_AVANT_RENVOI = 3;

/** Nombre maximal de leçons proposées à la révision. */
export const LECONS_A_REVOIR_MAX = 2;

// ==================== CORRESPONDANCE ====================

/**
 * Numéro de la leçon (ou des leçons) couverte par chaque question, dans l'ordre des
 * questions du quiz. Un vrai-faux qui touche deux leçons les cite toutes les deux.
 */
export const LECONS_DES_QUESTIONS: Readonly<Record<string, readonly (number | number[])[]>> = {
  m01: [1, 2, 3, 4, 5, [1, 2], 5, 3],
  m02: [1, 2, 3, 3, 4, 2, [3, 4], 2],
  m03: [1, 1, 3, 2, 4, [1, 2], [3, 4], 1],
  m04: [1, 3, [1, 3], 4, 5, [1, 2], [4, 5], 4],
  m05: [1, 1, 2, 3, 3, 1, 3, 1],
  m06: [1, 3, 3, 4, 4, [1, 2], 4, 1],
  m07: [2, 2, 3, 3, 3, 2, 3, [2, 3]],
  m08: [1, 2, 2, 3, 5, [2, 4], 5, 2],
  m09: [1, 2, 3, 4, 5, [1, 2], 5, 4],
  m10: [1, 2, 3, 2, 4, 1, 2, 2],
  m11: [1, 2, 2, 3, 3, 2, 3, [1, 2, 3]],
  m12: [1, 1, 3, 3, 4, 2, [3, 4], 3],
  m13: [1, 1, 2, 2, 3, 1, 3, 1],
};

// ==================== LEÇONS À REVOIR ====================

/** Leçon proposée à la révision. */
export type LeconARevoir = { numero: number; titre: string; adresse: string };

/**
 * Leçons à revoir d'après les notes d'un essai : chaque question manquée « perd » des
 * points, répartis entre ses leçons ; les leçons qui en perdent le plus passent devant.
 *
 * @param moduleId - Identifiant du module (« m02 »)
 * @param notes    - Note de chaque question sur 100, dans l'ordre du quiz
 * @returns Au plus LECONS_A_REVOIR_MAX leçons, la plus mal comprise d'abord
 *
 * Exemple : leconsARevoir("m02", [100, 0, 100, 100, 100, 100, 100, 0]) → leçon 2
 */
export function leconsARevoir(moduleId: string, notes: readonly number[]): LeconARevoir[] {
  const mod = MODULES.find((m) => m.id === moduleId);
  const carte = LECONS_DES_QUESTIONS[moduleId];
  if (!mod || !carte) return [];
  const pertes = new Map<number, number>();
  notes.forEach((note, i) => {
    const lecons = carte[i];
    if (lecons === undefined || note >= 100) return;
    const liste = Array.isArray(lecons) ? lecons : [lecons];
    for (const n of liste) pertes.set(n, (pertes.get(n) ?? 0) + (100 - note) / liste.length);
  });
  return [...pertes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, LECONS_A_REVOIR_MAX)
    .flatMap(([n]) => {
      const lecon = mod.lecons.find((l) => l.numero === n);
      return lecon ? [{ numero: n, titre: lecon.titre, adresse: adresseLecon(mod, lecon) }] : [];
    });
}
