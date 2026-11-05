/**
 * =============================================================
 *  Fichier    : powerbi.ts
 *  Projet     : Kalami Données
 *  Description: Accès aux textes de Kalami Données, séparés du dictionnaire principal
 *               pour que les pages de la librairie ne les téléchargent pas.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-05
 *  Dépendances: fr-powerbi.ts
 * =============================================================
 */

import powerbiFr from "./fr-powerbi";

/** Structure des textes de Kalami Données. */
export type PowerbiDictionary = typeof powerbiFr;

/** Retourne les textes de Kalami Données (français). */
export function getPowerbiDictionary(): PowerbiDictionary {
  return powerbiFr;
}
