/**
 * =============================================================
 *  Fichier    : mobile-money.ts
 *  Projet     : Kalami
 *  Description: Mobile Money manuel (Sprint 6, v0.11.0) : opérateurs, pays, validation des
 *               saisies (mêmes règles que la base), lecture du corps de la demande d'achat
 *               et état d'une commande Mobile Money. Sans accès à la base : testable seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/checkout-request.ts, lib/admin/validation.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import { type CheckoutBody, parseCheckoutBody } from "@/lib/payments/checkout-request";

// ==================== OPÉRATEURS ET PAYS ====================

/** Opérateurs connus (table mobile_money_operators) ; l'admin choisit lesquels sont ouverts. */
export const MM_OPERATORS = [
  "wave",
  "orange_money",
  "mtn_momo",
  "moov_money",
  "free_money",
] as const;
export type MobileMoneyOperator = (typeof MM_OPERATORS)[number];

/** Noms affichés des opérateurs (la table est réservée à l'admin). */
export const MM_OPERATOR_NAMES: Record<MobileMoneyOperator, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  moov_money: "Moov Money",
  free_money: "Free Money",
};

/** Pays de l'UEMOA (FCFA BCEAO) où un numéro marchand peut être saisi. */
export const MM_COUNTRIES = ["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG"] as const;
export type MobileMoneyCountry = (typeof MM_COUNTRIES)[number];

/** Délai pour payer et déclarer la transaction (même valeur que la base). */
export const MM_DECLARATION_HOURS = 24;

// ==================== VALIDATION DES SAISIES ====================

const PHONE_PATTERN = /^\+?[0-9 ]{8,20}$/;
const TRANSACTION_PATTERN = /^[A-Za-z0-9.-]{4,40}$/;

/**
 * Numéro de téléphone nettoyé (espaces multiples réduits), ou null s'il est invalide.
 * @param raw - Saisie brute (« +225 07 00 00 00 00 »)
 */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const phone = raw.trim().replace(/\s+/g, " ");
  return PHONE_PATTERN.test(phone) ? phone : null;
}

/**
 * Numéro de transaction nettoyé, ou null s'il est invalide (4 à 40 caractères : lettres,
 * chiffres, point et tiret).
 * @param raw - Saisie brute
 */
export function normalizeTransactionId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  return TRANSACTION_PATTERN.test(id) ? id : null;
}

/** Vrai si la valeur est un opérateur connu. */
export function isMobileMoneyOperator(value: unknown): value is MobileMoneyOperator {
  return (MM_OPERATORS as readonly unknown[]).includes(value);
}

/** Vrai si la valeur est un pays de l'UEMOA. */
export function isMobileMoneyCountry(value: unknown): value is MobileMoneyCountry {
  return (MM_COUNTRIES as readonly unknown[]).includes(value);
}

// ==================== DEMANDE D'ACHAT ====================

/** Demande d'achat par Mobile Money : article, FCFA, numéro marchand choisi. */
export type MobileMoneyBody = CheckoutBody & { currency: "XOF"; accountId: string };

/**
 * Valide le corps JSON d'un achat par Mobile Money (FCFA seulement).
 * @param raw - Corps JSON reçu
 * @returns Demande valide, ou null
 *
 * Exemple :
 *   parseMobileMoneyBody({ item: "study_offer", code: "study", currency: "XOF",
 *     accountId: "…uuid…" })
 */
export function parseMobileMoneyBody(raw: unknown): MobileMoneyBody | null {
  const body = parseCheckoutBody(raw);
  if (!body || body.currency !== "XOF") return null;
  const accountId = (raw as Record<string, unknown>).accountId;
  if (!isUuid(accountId)) return null;
  return { ...body, currency: "XOF", accountId };
}

// ==================== ÉTAT D'UNE COMMANDE ====================

/** Champs Mobile Money d'une commande, tels que l'acheteur les lit. */
export type MobileMoneyOrderFields = {
  status: string;
  provider: string;
  mm_expires_at: string | null;
  mm_declared_at: string | null;
};

/** Étape d'une commande Mobile Money, du point de vue de l'acheteur. */
export type MobileMoneyStage = "to_pay" | "to_review" | "paid" | "rejected" | "expired";

/**
 * Étape d'une commande Mobile Money. Une commande non déclarée dont le délai est passé est
 * échue, même si la tâche quotidienne ne l'a pas encore marquée.
 * @param order - Commande Mobile Money
 * @param now - Instant de référence (tests)
 * @returns Étape, ou null si la commande n'est pas payée par Mobile Money
 */
export function mobileMoneyStage(
  order: MobileMoneyOrderFields,
  now: Date = new Date(),
): MobileMoneyStage | null {
  if (order.provider !== "mobile_money") return null;
  if (order.status === "paid" || order.status === "refunded") return "paid";
  if (order.status === "failed") return "rejected";
  if (order.status === "expired") return "expired";
  if (order.mm_declared_at) return "to_review";
  if (order.mm_expires_at && new Date(order.mm_expires_at) <= now) return "expired";
  return "to_pay";
}

/** Erreurs de la base montrées à l'acheteur (achat et déclaration). */
export const MM_ERRORS = [
  "operator_unavailable",
  "order_not_found",
  "already_declared",
  "order_expired",
  "invalid_transaction",
  "invalid_payer",
  "transaction_used",
] as const;
