/**
 * =============================================================
 *  Fichier    : index.ts
 *  Projet     : Kalami
 *  Description: Accès aux dictionnaires de langue et interpolation des variables.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-06
 *  Dépendances: fr.ts
 * =============================================================
 */

import fr, { type Dictionary } from "./fr";

export const LOCALES = ["fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

const dictionaries: Record<Locale, Dictionary> = { fr };

/** Retourne le dictionnaire de la langue demandée (français par défaut). */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Remplace les variables « {nom} » d'un texte par leurs valeurs.
 * @param text   - Texte contenant des variables
 * @param values - Valeurs à insérer
 * @returns Texte final ; une variable inconnue est laissée telle quelle
 *
 * Exemple : interpolate("Bienvenue sur {appName}", { appName: "Kalami" })
 */
export function interpolate(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
