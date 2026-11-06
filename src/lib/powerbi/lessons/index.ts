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
  "fabric/analytique-de-bout-en-bout": () => import("./fabric/analytique-de-bout-en-bout"),
  "fabric/equipes-de-donnees": () => import("./fabric/equipes-de-donnees"),
  "fabric/activer-et-utiliser-fabric": () => import("./fabric/activer-et-utiliser-fabric"),
  "obtenir-les-donnees/fichiers": () => import("./obtenir-les-donnees/fichiers"),
  "obtenir-les-donnees/bases-relationnelles": () =>
    import("./obtenir-les-donnees/bases-relationnelles"),
  "obtenir-les-donnees/rapports-dynamiques": () =>
    import("./obtenir-les-donnees/rapports-dynamiques"),
  "obtenir-les-donnees/nosql": () => import("./obtenir-les-donnees/nosql"),
  "obtenir-les-donnees/services-en-ligne": () => import("./obtenir-les-donnees/services-en-ligne"),
  "obtenir-les-donnees/mode-de-stockage": () => import("./obtenir-les-donnees/mode-de-stockage"),
  "obtenir-les-donnees/analysis-services": () => import("./obtenir-les-donnees/analysis-services"),
  "obtenir-les-donnees/performance": () => import("./obtenir-les-donnees/performance"),
  "obtenir-les-donnees/erreurs-import": () => import("./obtenir-les-donnees/erreurs-import"),
  "framework-de-modele/introduction": () => import("./framework-de-modele/introduction"),
  "framework-de-modele/fondements-du-modele": () =>
    import("./framework-de-modele/fondements-du-modele"),
  "framework-de-modele/modele-importation": () =>
    import("./framework-de-modele/modele-importation"),
  "framework-de-modele/modele-directquery": () =>
    import("./framework-de-modele/modele-directquery"),
  "framework-de-modele/modele-composite": () => import("./framework-de-modele/modele-composite"),
  "framework-de-modele/choisir-un-framework": () =>
    import("./framework-de-modele/choisir-un-framework"),
  "nettoyer-transformer/introduction": () => import("./nettoyer-transformer/introduction"),
  "nettoyer-transformer/mise-en-forme": () => import("./nettoyer-transformer/mise-en-forme"),
  "nettoyer-transformer/simplifier-la-structure": () =>
    import("./nettoyer-transformer/simplifier-la-structure"),
  "nettoyer-transformer/types-de-colonnes": () =>
    import("./nettoyer-transformer/types-de-colonnes"),
  "nettoyer-transformer/combiner-des-tables": () =>
    import("./nettoyer-transformer/combiner-des-tables"),
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
