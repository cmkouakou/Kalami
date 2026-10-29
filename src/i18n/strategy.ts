/**
 * =============================================================
 *  Fichier    : strategy.ts
 *  Projet     : Kalami Stratégie
 *  Description: Accès aux textes de Kalami Stratégie, séparés du dictionnaire principal
 *               pour que les pages de la librairie ne les téléchargent pas.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 *  Dépendances: fr-strategy.ts
 * =============================================================
 */

import strategyFr from "./fr-strategy";

/** Structure des textes de Kalami Stratégie. */
export type StrategyDictionary = typeof strategyFr;

/** Retourne les textes de Kalami Stratégie (français). */
export function getStrategyDictionary(): StrategyDictionary {
  return strategyFr;
}
