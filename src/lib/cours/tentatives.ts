/**
 * =============================================================
 *  Fichier    : tentatives.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Décompte des tentatives aux exercices et aux quiz (v0.43.0) : rang
 *               ordinal (« 1re », « 2e »), libellé au pluriel, et cumul par apprenant
 *               pour la fiche du tableau de bord. Fonctions pures, testées.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-20
 *  Dépendances: (aucune)
 * =============================================================
 */

/** Meilleure note et nombre de tentatives à un exercice ou un quiz. */
export type ResultatTentatives = { meilleure: number; essais: number };

/**
 * Rang ordinal d'une tentative en français.
 * @param n - Numéro de la tentative (1, 2, 3…)
 * @returns « 1re », « 2e », « 3e »…
 *
 * Exemple d'utilisation :
 *   rangTentative(2); // « 2e »
 */
export function rangTentative(n: number): string {
  return n === 1 ? "1re" : `${n}e`;
}

/**
 * Nombre de tentatives avec l'accord : « 1 tentative », « 3 tentatives ».
 * @param n - Nombre de tentatives
 */
export function nombreTentatives(n: number): string {
  return `${n} tentative${n > 1 ? "s" : ""}`;
}

/**
 * Meilleure note et nombre de tentatives par exercice.
 *
 * @param lignes - Tentatives (identifiant et note ; une note illisible est ignorée)
 * @returns Résultat par identifiant d'exercice
 */
export function resultatsParExercice(
  lignes: { exercise_id: string; score: number | string }[],
): Map<string, ResultatTentatives> {
  const parExercice = new Map<string, ResultatTentatives>();
  for (const l of lignes) {
    const score = Number(l.score);
    if (!Number.isFinite(score)) continue;
    const actuel = parExercice.get(l.exercise_id);
    parExercice.set(l.exercise_id, {
      meilleure: Math.max(actuel?.meilleure ?? 0, score),
      essais: (actuel?.essais ?? 0) + 1,
    });
  }
  return parExercice;
}

/**
 * Total des tentatives d'un apprenant, exercices de leçon et quiz de module à part
 * (l'examen final n'est compté ni dans l'un ni dans l'autre).
 * @param lignes - Tentatives de l'apprenant
 */
export function totalTentatives(lignes: { exercise_id: string }[]): {
  exercices: number;
  quiz: number;
} {
  let exercices = 0;
  let quiz = 0;
  for (const l of lignes) {
    if (/^m\d{2}-quiz$/.test(l.exercise_id)) quiz++;
    else if (/^m\d{2}-l\d{2}-e\d{1,2}$/.test(l.exercise_id)) exercices++;
  }
  return { exercices, quiz };
}
