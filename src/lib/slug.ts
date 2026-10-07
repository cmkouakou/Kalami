/**
 * =============================================================
 *  Fichier    : slug.ts
 *  Projet     : Kalami
 *  Description: Génération d'identifiants lisibles pour les URL (« slugs »), conformes à la
 *               contrainte SQL ^[a-z0-9]+(-[a-z0-9]+)*$.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 * =============================================================
 */

/** Longueur maximale d'un slug. */
export const SLUG_MAX_LENGTH = 80;

/** Format accepté par la base de données. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Transforme un texte libre en slug : minuscules, sans accents, mots séparés par « - ».
 *
 * Exemple : slugify("La stratégie d'entreprise") → "la-strategie-d-entreprise"
 *
 * @param text - Titre, nom ou libellé
 * @returns Slug (chaîne vide si le texte ne contient aucune lettre ni chiffre)
 */
export function slugify(text: string): string {
  return text
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}

/**
 * Vérifie qu'une chaîne est un slug valide.
 * @param value - Valeur à tester
 * @returns true si la valeur respecte le format et la longueur maximale
 */
export function isValidSlug(value: string): boolean {
  return value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value);
}
