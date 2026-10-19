/**
 * =============================================================
 *  Fichier    : ledger.ts
 *  Projet     : Kalami
 *  Description: Calculs purs du grand livre (Sprint 10a, v0.12.0) : conversion des frais
 *               Stripe dans la devise de la commande, saisie d'un pourcentage en points de
 *               base, types des soldes de l'auteur et des totaux de la plateforme (calculés
 *               par la base, comme les écritures). v1.1 : demandes de versement (10b).
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/catalog/types.ts
 * =============================================================
 */

import type { Currency } from "@/lib/catalog/types";

// ==================== TYPES ====================

/** Écriture du grand livre telle que lue dans la base. */
export type LedgerEntry = {
  id: string;
  entry_type: "sale" | "refund";
  reference: string;
  item_kind: string;
  label: string;
  book_id: string | null;
  author_id: string | null;
  provider: string;
  currency: Currency;
  gross_minor: number;
  fee_minor: number;
  tax_minor: number;
  commission_minor: number;
  author_minor: number;
  author_share_bps: number;
  available_at: string;
  created_at: string;
};

/** Revenus d'un auteur dans une devise. */
export type AuthorBalance = {
  currency: Currency;
  /** Ventes moins remboursements */
  sales: number;
  gross: number;
  /** Part de l'auteur, toutes écritures */
  earned: number;
  /** Part disponible (délai écoulé), moins les demandes ouvertes et le déjà versé */
  available: number;
  /** Part encore dans le délai de disponibilité */
  pending: number;
  /** Demandes de versement ouvertes (montant retenu) */
  requested: number;
  /** Déjà versé */
  paid: number;
};

/** Totaux de la plateforme dans une devise. */
export type PlatformTotals = {
  currency: Currency;
  sales: number;
  gross: number;
  fees: number;
  taxes: number;
  commission: number;
  authors: number;
};

// ==================== CONSTANTES ====================

/** Décimales des devises de règlement Stripe possibles (2 par défaut). */
const DIGITS: Record<string, number> = { xof: 0, eur: 2, cad: 2, usd: 2, jpy: 0 };

// ==================== FONCTIONS ====================

/**
 * Frais Stripe exprimés dans la devise de la commande. Stripe donne les frais dans la
 * devise de règlement du compte, avec le taux appliqué (montant d'origine × taux =
 * montant réglé, en unités principales).
 * @param feeMinor - Frais en unité mineure de la devise de règlement
 * @param feeCurrency - Devise de règlement (ex. « cad »)
 * @param exchangeRate - Taux appliqué, ou null si aucune conversion
 * @param orderCurrency - Devise de la commande
 * @returns Frais en unité mineure de la commande, ou null s'ils ne peuvent être convertis
 */
export function feeInOrderCurrency(
  feeMinor: number | null | undefined,
  feeCurrency: string | null | undefined,
  exchangeRate: number | null | undefined,
  orderCurrency: Currency,
): number | null {
  if (typeof feeMinor !== "number" || !Number.isFinite(feeMinor) || feeMinor < 0) return null;
  const from = (feeCurrency ?? "").toLowerCase();
  const to = orderCurrency.toLowerCase();
  if (from === to) return Math.round(feeMinor);
  if (typeof exchangeRate !== "number" || !(exchangeRate > 0)) return null;
  const settledMajor = feeMinor / 10 ** (DIGITS[from] ?? 2);
  return Math.round((settledMajor / exchangeRate) * 10 ** (DIGITS[to] ?? 2));
}

/**
 * Convertit un pourcentage saisi (« 70 », « 72,5 ») en points de base.
 * @param input - Valeur du formulaire
 * @param max - Pourcentage maximal accepté
 * @returns Points de base (7000 pour 70 %), ou null si la saisie est invalide
 */
export function percentToBps(input: unknown, max = 100): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().replace(",", ".").replace(/\s*%$/, "");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(cleaned)) return null;
  const bps = Math.round(Number(cleaned) * 100);
  return bps <= max * 100 ? bps : null;
}

/**
 * Affiche des points de base en pourcentage (« 70 », « 72,5 »).
 * @param bps - Points de base
 * @returns Pourcentage sans le signe
 */
export function bpsToPercent(bps: number): string {
  return String(bps / 100).replace(".", ",");
}

/**
 * Indique si une écriture est disponible (délai de garde écoulé).
 * @param availableAt - Date de disponibilité (ISO)
 * @param now - Instant de référence
 */
export function isAvailable(availableAt: string, now: Date = new Date()): boolean {
  return new Date(availableAt).getTime() <= now.getTime();
}

/** Ordre d'affichage des devises. */
const CURRENCY_ORDER: Currency[] = ["XOF", "EUR", "CAD"];

/** Écriture réduite aux montants (lecture du tableau de bord). */
export type LedgerAmounts = Pick<
  LedgerEntry,
  | "entry_type"
  | "currency"
  | "gross_minor"
  | "fee_minor"
  | "tax_minor"
  | "commission_minor"
  | "author_minor"
>;

/**
 * Totaux par devise d'un ensemble d'écritures ; un remboursement retire une vente (ses
 * montants sont déjà négatifs), comme admin_ledger_totals().
 * @param entries - Écritures (ventes et remboursements)
 * @returns Totaux dans l'ordre XOF, EUR, CAD (devises sans écriture omises)
 */
export function summarizeEntries(entries: LedgerAmounts[]): PlatformTotals[] {
  const totals = new Map<Currency, PlatformTotals>();
  for (const entry of entries) {
    const row = totals.get(entry.currency) ?? {
      currency: entry.currency,
      sales: 0,
      gross: 0,
      fees: 0,
      taxes: 0,
      commission: 0,
      authors: 0,
    };
    row.sales += entry.entry_type === "sale" ? 1 : -1;
    row.gross += entry.gross_minor;
    row.fees += entry.fee_minor;
    row.taxes += entry.tax_minor;
    row.commission += entry.commission_minor;
    row.authors += entry.author_minor;
    totals.set(entry.currency, row);
  }
  return CURRENCY_ORDER.flatMap((currency) => totals.get(currency) ?? []);
}
