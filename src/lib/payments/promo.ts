/**
 * =============================================================
 *  Fichier    : promo.ts
 *  Projet     : Kalami
 *  Description: Codes promo (v0.10.3) : lecture du code saisi, conversion de l'aperçu renvoyé
 *               par la base et prix réduit dans chaque devise. Même calcul que la base
 *               (promo_discount) : le prix affiché correspond au montant facturé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/catalog/types.ts
 * =============================================================
 */

import type { Currency, Price } from "@/lib/catalog/types";

// ==================== CONSTANTES ====================

/** Forme d'un code : 3 à 30 caractères, lettres majuscules, chiffres, « - » et « _ ». */
const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;

/** Plus petit total accepté après réduction (même valeur que promo_min_total). */
export const PROMO_MIN_TOTAL: Record<Currency, number> = { XOF: 500, EUR: 50, CAD: 50 };

/** Codes d'erreur de la base liés aux codes promo. */
export const PROMO_ERRORS = [
  "promo_invalid",
  "promo_expired",
  "promo_exhausted",
  "promo_used",
  "promo_not_applicable",
  "promo_too_low",
] as const;

// ==================== TYPES ====================

/** Réduction d'un code : pourcentage, ou montant en unité mineure par devise. */
export type PromoPreview = {
  code: string;
  percentOff: number | null;
  amountOff: Partial<Record<Currency, number>>;
};

/** Ligne renvoyée par la fonction promo_preview. */
export type PromoPreviewRow = {
  code: string;
  percent_off: number | null;
  amount_off_xof: number | null;
  amount_off_eur: number | string | null;
  amount_off_cad: number | string | null;
};

/** Prix d'origine et prix réduit (null si le code ne vaut pas dans cette devise). */
export type DiscountedPrice = Price & { reduced: number | null };

// ==================== FONCTIONS ====================

/**
 * Normalise un code saisi (espaces retirés, majuscules).
 * @param raw - Valeur saisie
 * @returns Code valide dans sa forme, ou null
 *
 * Exemple :
 *   normalizePromoCode(" rentree-25 ") → "RENTREE-25"
 */
export function normalizePromoCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return PROMO_CODE_PATTERN.test(code) ? code : null;
}

/**
 * Convertit la ligne de la base (montants décimaux) en aperçu (unité mineure).
 * @param row - Ligne de promo_preview
 */
export function promoFromRow(row: PromoPreviewRow): PromoPreview {
  const cents = (value: number | string | null) =>
    value === null ? undefined : Math.round(Number(value) * 100);
  const amountOff: Partial<Record<Currency, number>> = {};
  if (row.amount_off_xof !== null) amountOff.XOF = row.amount_off_xof;
  const eur = cents(row.amount_off_eur);
  if (eur !== undefined) amountOff.EUR = eur;
  const cad = cents(row.amount_off_cad);
  if (cad !== undefined) amountOff.CAD = cad;
  return { code: row.code, percentOff: row.percent_off, amountOff };
}

/**
 * Prix réduit par un code, ou null si le code ne vaut pas dans la devise ou si le total
 * passerait sous le minimum accepté par Stripe.
 * @param price - Prix d'origine (unité mineure)
 * @param promo - Réduction du code
 *
 * Exemple :
 *   discountedAmount({ currency: "CAD", amount_minor: 1299 }, { percentOff: 20, … }) → 1039
 */
export function discountedAmount(price: Price, promo: PromoPreview): number | null {
  const reduced =
    promo.percentOff !== null
      ? Math.round((price.amount_minor * (100 - promo.percentOff)) / 100)
      : promo.amountOff[price.currency] === undefined
        ? null
        : price.amount_minor - promo.amountOff[price.currency]!;
  if (reduced === null || reduced < PROMO_MIN_TOTAL[price.currency]) return null;
  return reduced;
}

/**
 * Prix d'origine et prix réduits de toutes les devises d'un article.
 * @param prices - Prix d'origine
 * @param promo - Réduction du code (null : aucun code)
 */
export function applyPromo(prices: Price[], promo: PromoPreview | null): DiscountedPrice[] {
  return prices.map((price) => ({
    ...price,
    reduced: promo ? discountedAmount(price, promo) : null,
  }));
}
