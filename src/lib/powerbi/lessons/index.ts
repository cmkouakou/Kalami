/**
 * =============================================================
 *  Fichier    : index.ts (lessons)
 *  Projet     : Kalami Données
 *  Description: Registre des résumés de leçons. Chaque entrée charge son fichier à la
 *               demande, pour qu'une page de leçon ne télécharge que son propre texte.
 *               Une leçon absente du registre s'affiche comme « à venir » : c'est ce
 *               registre, et non la carte du parcours, qui fait foi.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: lib/powerbi/content.ts
 * =============================================================
 */

import type { LessonContent } from "@/lib/powerbi/content";

/** Clé d'une leçon : « module/lecon ». */
type LessonKey = `${string}/${string}`;

/** Chargeurs des résumés, par clé de leçon. */
const RESUMES: Partial<Record<LessonKey, () => Promise<{ default: LessonContent }>>> = {
  "framework-de-modele/introduction": () => import("./framework-de-modele/introduction"),
  "framework-de-modele/fondements-du-modele": () =>
    import("./framework-de-modele/fondements-du-modele"),
  "nettoyer-transformer/editeur-avance": () => import("./nettoyer-transformer/editeur-avance"),
  "nettoyer-transformer/profiler-les-donnees": () =>
    import("./nettoyer-transformer/profiler-les-donnees"),
};

/** Vrai si le résumé de cette leçon est écrit. */
export function aUnResume(moduleSlug: string, lessonSlug: string): boolean {
  return `${moduleSlug}/${lessonSlug}` in RESUMES;
}

/** Charge le résumé d'une leçon, ou null s'il n'est pas encore écrit. */
export async function getResume(
  moduleSlug: string,
  lessonSlug: string,
): Promise<LessonContent | null> {
  const charger = RESUMES[`${moduleSlug}/${lessonSlug}`];
  if (!charger) return null;
  const charge = await charger();
  return charge.default;
}

/** Nombre de résumés écrits. */
export function compterResumes(): number {
  return Object.keys(RESUMES).length;
}
