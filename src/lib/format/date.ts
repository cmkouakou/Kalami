/**
 * =============================================================
 *  Fichier    : date.ts
 *  Projet     : Kalami
 *  Description: Formats de date et d'heure de toute l'interface, dans un seul fuseau
 *               (Abidjan). Le serveur et le navigateur produisent ainsi le même texte, ce qui
 *               évite les erreurs d'hydratation React (#418). Utilisable côté serveur et client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-29
 * =============================================================
 */

// ==================== CONSTANTES ====================

/**
 * Fuseau d'affichage de toute l'application. Abidjan est à UTC+0 toute l'année (pas d'heure
 * d'été) : les dates seules (AAAA-MM-JJ, lues à minuit UTC) restent donc au bon jour.
 * Pour changer de fuseau, modifier cette seule constante et relancer tests/unit/format-date.
 */
export const DISPLAY_TIME_ZONE = "Africa/Abidjan";

/** Langue des formats. */
const LOCALE = "fr-FR";

/**
 * Crée un format dans le fuseau d'affichage.
 * @param options - Options d'Intl.DateTimeFormat (sans fuseau)
 * @returns Format prêt à l'emploi (.format(date))
 */
function inDisplayZone(options: Omit<Intl.DateTimeFormatOptions, "timeZone">) {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: DISPLAY_TIME_ZONE });
}

// ==================== FORMATS ====================

/** 29 oct. 2026 */
export const DATE_FORMAT = inDisplayZone({ dateStyle: "medium" });
/** 29 octobre 2026 */
export const DATE_LONG_FORMAT = inDisplayZone({ dateStyle: "long" });
/** jeudi 29 octobre 2026 */
export const DATE_FULL_FORMAT = inDisplayZone({ dateStyle: "full" });
/** 29 oct. 2026, 14:05 */
export const DATE_TIME_FORMAT = inDisplayZone({ dateStyle: "medium", timeStyle: "short" });
/** 29 octobre 2026 à 14:05 */
export const DATE_TIME_LONG_FORMAT = inDisplayZone({ dateStyle: "long", timeStyle: "short" });
/** 29/10/2026 14:05:09 (journaux) */
export const DATE_TIME_SECONDS_FORMAT = inDisplayZone({ dateStyle: "short", timeStyle: "medium" });
/** 14:05 */
export const TIME_FORMAT = inDisplayZone({ timeStyle: "short" });
/** 29 oct. */
export const DAY_MONTH_FORMAT = inDisplayZone({ day: "numeric", month: "short" });
/** oct. */
export const MONTH_FORMAT = inDisplayZone({ month: "short" });
/** octobre 2026 */
export const MONTH_YEAR_FORMAT = inDisplayZone({ month: "long", year: "numeric" });
