/**
 * =============================================================
 *  Fichier    : currency.ts
 *  Projet     : Kalami
 *  Description: Devises : choix selon le pays, conversion unité mineure ↔ montant saisi,
 *               formatage des prix. Fonctions pures, utilisables côté serveur et client.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 * =============================================================
 */

import { CURRENCIES, type Currency, type Price } from "@/lib/catalog/types";

// ==================== CONSTANTES ====================

/** Cookie mémorisant la devise choisie par le visiteur. */
export const CURRENCY_COOKIE = "devise";

/** Devise utilisée hors UEMOA et hors Canada. */
export const DEFAULT_CURRENCY: Currency = "EUR";

/** Pays de l'UEMOA (franc CFA BCEAO). */
const UEMOA_COUNTRIES = new Set(["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG"]);

/** Nombre de décimales de chaque devise (le XOF n'en a pas). */
const MINOR_DIGITS: Record<Currency, number> = { XOF: 0, EUR: 2, CAD: 2 };

// ==================== FONCTIONS ====================

/**
 * Vérifie qu'une valeur quelconque est une devise acceptée.
 * @param value - Valeur à tester (cookie, formulaire, paramètre d'URL)
 * @returns true si la valeur est XOF, EUR ou CAD
 */
export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/**
 * Devise par défaut d'un pays (code ISO 3166-1 alpha-2).
 * @param country - Code pays, ex. « CI », ou null si inconnu
 * @returns XOF pour l'UEMOA, CAD pour le Canada, EUR sinon
 */
export function currencyForCountry(country: string | null | undefined): Currency {
  const code = country?.trim().toUpperCase() ?? "";
  if (UEMOA_COUNTRIES.has(code)) return "XOF";
  if (code === "CA") return "CAD";
  return DEFAULT_CURRENCY;
}

/**
 * Convertit un montant saisi (« 12,50 », « 5 000 ») en unité mineure.
 * @param input - Montant tel que tapé par l'utilisateur
 * @param currency - Devise du montant
 * @returns Entier en unité mineure, ou null si la saisie est invalide ou ≤ 0
 */
export function toMinorUnits(input: string, currency: Currency): number | null {
  const cleaned = input.replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const digits = MINOR_DIGITS[currency];
  const [, decimals = ""] = cleaned.split(".");
  if (decimals.length > digits) return null;
  const minor = Math.round(Number(cleaned) * 10 ** digits);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

/**
 * Convertit un montant en unité mineure vers sa valeur décimale (pour un champ de saisie).
 * @param amountMinor - Montant en unité mineure
 * @param currency - Devise du montant
 * @returns Valeur en unité principale, ex. 1250 EUR → 12.5
 */
export function fromMinorUnits(amountMinor: number, currency: Currency): number {
  return amountMinor / 10 ** MINOR_DIGITS[currency];
}

/**
 * Formate un prix pour l'affichage (ex. « 5 000 F CFA », « 12,50 € »).
 * @param amountMinor - Montant en unité mineure
 * @param currency - Devise du montant
 * @param locale - Langue d'affichage (français par défaut)
 * @returns Prix formaté selon les conventions locales
 */
export function formatPrice(amountMinor: number, currency: Currency, locale = "fr-FR"): string {
  const digits = MINOR_DIGITS[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fromMinorUnits(amountMinor, currency));
}

/**
 * Sélectionne le prix d'un livre dans la devise voulue.
 * @param prices - Prix du livre (une ligne par devise)
 * @param currency - Devise du visiteur
 * @returns Le prix correspondant, ou null si le livre n'est pas vendu dans cette devise
 */
export function pickPrice(prices: Price[], currency: Currency): Price | null {
  return prices.find((p) => p.currency === currency) ?? null;
}
