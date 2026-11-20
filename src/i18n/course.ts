/**
 * =============================================================
 *  Fichier    : course.ts
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Accès aux textes du cours, séparés du dictionnaire principal pour que
 *               les autres pages ne les téléchargent pas.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: fr-course.ts
 * =============================================================
 */

import courseFr from "./fr-course";

/** Structure des textes du cours. */
export type CourseDictionary = typeof courseFr;

/** Retourne les textes du cours (français). */
export function getCourseDictionary(): CourseDictionary {
  return courseFr;
}
