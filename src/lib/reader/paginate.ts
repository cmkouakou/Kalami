/**
 * =============================================================
 *  Fichier    : paginate.ts
 *  Projet     : Kalami
 *  Description: Découpage d'un chapitre en pages (fonctions pures). La mesure est fournie
 *               par l'appelant : dans le navigateur, une page cachée aux dimensions réelles ;
 *               dans les tests, une capacité en caractères. Les paragraphes sont coupés à
 *               une limite de mot ; les intertitres ne sont jamais coupés ni laissés seuls
 *               en bas de page. v1.1 : saut de page forcé après un bloc (breakAfter),
 *               pour la page d'ouverture d'un module.
 *               v1.2 : jamais de coupure à une espace insécable (« ? » seul en haut de
 *               page) ; une illustration trop haute pour la fin de page est réduite au
 *               lieu d'être reportée (blanc avant la figure).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-22
 *  Dépendances: types.ts
 * =============================================================
 */

import type { BlockInfo, Fragment, Page } from "./types";

/** Indique si une page tient dans la zone d'affichage. */
export type FitsFn = (page: Page) => boolean;

// ==================== OUTILS ====================

/**
 * Espaces sécables : toutes les espaces sauf les insécables (U+00A0, U+2007, U+202F),
 * posées par la typographie française avant « ? ! ; : » et dans les guillemets « ».
 */
const BREAKABLE_SPACES = /[^\S   ]+/g;

/** Réduction minimale d'une illustration à la suite du texte d'une page. */
const MIN_SCALE = 0.6;
/** Réduction minimale d'une illustration seule sur sa page (plus haute que la page). */
const MIN_SCALE_ALONE = 0.2;
/** Pas de réduction d'une illustration. */
const SCALE_STEP = 0.05;

/**
 * Décalages où un texte peut être coupé : juste après chaque suite d'espaces sécables
 * (jamais devant un « ? » : il ne doit pas commencer la page suivante).
 * @param text - Texte brut du bloc
 * @returns Décalages croissants, strictement entre 0 et la longueur du texte
 */
export function wordBreaks(text: string): number[] {
  const breaks: number[] = [];
  for (const match of text.matchAll(BREAKABLE_SPACES)) {
    const end = (match.index ?? 0) + match[0].length;
    if (end > 0 && end < text.length) breaks.push(end);
  }
  return breaks;
}

/**
 * Plus grande coupure qui laisse la page dans la zone d'affichage (recherche dichotomique :
 * plus le fragment est long, moins il a de chances de tenir).
 * @returns Décalage de fin retenu, ou null si même le premier mot ne tient pas
 */
function largestFittingBreak(
  page: Page,
  block: number,
  start: number,
  options: number[],
  fits: FitsFn,
): number | null {
  let low = 0;
  let high = options.length - 1;
  let best: number | null = null;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (fits([...page, { block, start, end: options[middle] }])) {
      best = options[middle];
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return best;
}

/**
 * Plus grande réduction d'une illustration qui la fait tenir sur la page (recherche
 * dichotomique : plus elle est petite, plus elle a de chances de tenir).
 * @param minimum - Réduction la plus forte acceptée
 * @returns Part de la hauteur retenue (< 1), ou null si même la plus forte ne suffit pas
 */
function largestFittingScale(
  page: Page,
  fragment: Fragment,
  minimum: number,
  fits: FitsFn,
): number | null {
  // Réductions possibles, de la plus faible (0,95) à la plus forte (minimum)
  const scales: number[] = [];
  for (let step = 1; 1 - step * SCALE_STEP >= minimum - 1e-9; step++) {
    scales.push(Math.round((1 - step * SCALE_STEP) * 100) / 100);
  }
  let low = 0;
  let high = scales.length - 1;
  let best: number | null = null;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (fits([...page, { ...fragment, scale: scales[middle] }])) {
      best = scales[middle];
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }
  return best;
}

// ==================== PAGINATION ====================

/**
 * Découpe les blocs d'un chapitre en pages.
 *
 * Pour chaque bloc : le placer entier sur la page courante s'il tient ; sinon couper un
 * paragraphe au dernier mot qui tient, ou passer à la page suivante. Un bloc trop grand
 * pour une page vide est placé quand même (dépassement accepté plutôt qu'une boucle).
 * Un bloc marqué breakAfter ferme sa page : le bloc suivant commence une page neuve.
 * Une illustration qui ne tient pas est réduite (jusqu'à 60 % à la suite du texte, plus
 * si elle est seule sur sa page) avant d'être reportée.
 *
 * @param blocks - Description des blocs du chapitre
 * @param fits   - Mesure : vrai si la page tient dans la zone d'affichage
 * @returns Pages (au moins une, éventuellement vide si le chapitre l'est)
 *
 * Exemple : paginate([{ length: 10, breaks: [5], heading: false }], (p) => true)
 *           → [[{ block: 0, start: 0, end: 10 }]]
 */
export function paginate(blocks: BlockInfo[], fits: FitsFn): Page[] {
  const pages: Page[] = [];
  let current: Page = [];

  /** Ferme la page ; un intertitre en bas de page est reporté sur la suivante. */
  const closePage = () => {
    const last = current[current.length - 1];
    const carry = current.length > 1 && last && blocks[last.block].heading ? [last] : [];
    pages.push(carry.length ? current.slice(0, -1) : current);
    current = carry;
  };

  blocks.forEach((info, block) => {
    let start = 0;
    for (;;) {
      const whole = { block, start, end: info.length };
      if (fits([...current, whole])) {
        current.push(whole);
        if (info.breakAfter) {
          // Saut forcé : pas de report d'intertitre, la page se ferme telle quelle
          pages.push(current);
          current = [];
        }
        return;
      }

      if (info.shrinkable) {
        // Illustration un peu trop haute : réduite sur cette page plutôt que reportée
        // (le report laissait un blanc) ; seule sur sa page, réduite jusqu'à y tenir
        const minimum = current.length > 0 ? MIN_SCALE : MIN_SCALE_ALONE;
        const scale = largestFittingScale(current, whole, minimum, fits);
        if (scale !== null) {
          current.push({ ...whole, scale });
          return;
        }
      }

      const options = info.heading ? [] : info.breaks.filter((b) => b > start);
      const end = largestFittingBreak(current, block, start, options, fits);
      if (end !== null) {
        current.push({ block, start, end });
        closePage();
        start = end;
        continue;
      }

      if (current.length > 0) {
        // Rien ne tient sur la fin de cette page : réessai sur une page neuve
        closePage();
        continue;
      }

      // Page vide et pas même un mot ne tient : placement forcé
      const forcedEnd = options[0] ?? info.length;
      current.push({ block, start, end: forcedEnd });
      if (forcedEnd === info.length) return;
      closePage();
      start = forcedEnd;
    }
  });

  if (current.length > 0 || pages.length === 0) pages.push(current);
  return pages;
}

// ==================== POSITION ↔ PAGE ====================

/**
 * Page qui contient une position (bloc + décalage).
 * @returns Indice de page ; 0 si la position précède tout, dernière page si elle suit tout
 */
export function pageIndexOf(pages: Page[], block: number, offset: number): number {
  for (let index = 0; index < pages.length; index++) {
    for (const fragment of pages[index]) {
      if (fragment.block > block) return index;
      if (fragment.block === block && (offset < fragment.end || fragment.end === fragment.start)) {
        return index;
      }
    }
  }
  return Math.max(0, pages.length - 1);
}

/**
 * Position du début d'une page (premier fragment).
 * @returns Bloc et décalage, ou début du chapitre pour une page vide
 */
export function pageStart(pages: Page[], index: number): { block: number; offset: number } {
  const first = pages[index]?.[0];
  return first ? { block: first.block, offset: first.start } : { block: 0, offset: 0 };
}
