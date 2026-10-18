/**
 * =============================================================
 *  Fichier    : promo.ts (reader)
 *  Projet     : Kalami
 *  Description: Encart Kalami Stratégie dans le livre guide (fonctions pures, client et
 *               serveur) : affiché sur la fiche du livre, à la fin de l'extrait et à la fin
 *               de chaque module qui se termine par « À vous de jouer » (jamais à la fin du
 *               livre).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-17
 *  Dépendances: lib/strategy/steps.ts
 * =============================================================
 */

import { GUIDE_BOOK_SLUG } from "@/lib/strategy/steps";

/** Adresse de Kalami Stratégie (même domaine que la bibliothèque). */
export const STRATEGY_HREF = "/strategie";

/** Intertitre de la section d'exercices (espaces insécables possibles). */
const EXERCISES_HEADING = /^<h2>\s*À(?:\s|&nbsp;)+vous(?:\s|&nbsp;)+de(?:\s|&nbsp;)+jouer\s*<\/h2>$/;

/**
 * Indique si l'encart Kalami Stratégie accompagne ce livre.
 * @param slug - Identifiant lisible du livre
 * @returns true pour le livre guide de la démarche
 */
export function hasStrategyPromo(slug: string): boolean {
  return slug === GUIDE_BOOK_SLUG;
}

/**
 * Indique si un chapitre contient la section « À vous de jouer ».
 * @param blocks - Blocs HTML du chapitre
 * @returns true si l'un des blocs est l'intertitre de la section
 *
 * Exemple : hasExercises(["<p>…</p>", "<h2>À vous de jouer</h2>"]) → true
 */
export function hasExercises(blocks: string[]): boolean {
  return blocks.some((block) => EXERCISES_HEADING.test(block));
}
