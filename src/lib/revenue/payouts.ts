/**
 * =============================================================
 *  Fichier    : payouts.ts
 *  Projet     : Kalami
 *  Description: Versements aux auteurs (Sprint 10b, v0.12.1) : types d'une demande,
 *               statuts, formats acceptés pour le justificatif, chemin de dépôt, contrôle
 *               d'une demande possible et début du mois (tableau de bord). Calculs purs,
 *               utilisables côté navigateur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/catalog/types.ts, lib/revenue/ledger.ts
 * =============================================================
 */

import type { Currency } from "@/lib/catalog/types";
import type { AuthorBalance } from "@/lib/revenue/ledger";

// ==================== TYPES ====================

export const PAYOUT_STATUSES = ["requested", "approved", "paid", "rejected", "cancelled"] as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

/** Demande de versement telle que lue dans la base. */
export type PayoutRequest = {
  id: string;
  reference: string;
  author_id: string | null;
  author_name: string;
  currency: Currency;
  amount_minor: number;
  status: PayoutStatus;
  payout_method: "bank" | "mobile_money";
  payout_details: Record<string, string | null>;
  approved_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  proof_path: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
};

/** Raison pour laquelle une devise ne peut pas encore être versée. */
export type PayoutBlocker = "no_details" | "open" | "below_minimum" | null;

// ==================== CONSTANTES ====================

/** Seau privé des justificatifs (administrateurs seulement). */
export const PAYOUT_PROOFS_BUCKET = "payout-proofs";

/** Taille maximale d'un justificatif : 5 Mo. */
export const PAYOUT_PROOF_MAX_BYTES = 5 * 1024 * 1024;

/** Formats du justificatif, par extension. */
export const PAYOUT_PROOF_FORMATS: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Statuts d'une demande encore ouverte (montant retenu, à traiter). */
export const OPEN_STATUSES: readonly PayoutStatus[] = ["requested", "approved"];

// ==================== FONCTIONS ====================

/**
 * Indique si une valeur est un statut de demande connu.
 * @param value - Valeur à contrôler (paramètre d'URL…)
 */
export function isPayoutStatus(value: unknown): value is PayoutStatus {
  return typeof value === "string" && (PAYOUT_STATUSES as readonly string[]).includes(value);
}

/**
 * Extension acceptée d'un justificatif, déduite du nom (le type MIME du navigateur peut
 * être vide sous Windows).
 * @param fileName - Nom du fichier choisi
 * @returns Extension en minuscules, ou null si le format est refusé
 */
export function proofExtension(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extension in PAYOUT_PROOF_FORMATS ? extension : null;
}

/**
 * Chemin du justificatif dans le seau : un dossier par demande (contrôlé par la base).
 * @param payoutId - Demande de versement
 * @param extension - Extension acceptée
 * @param fileId - Identifiant unique du fichier
 */
export function proofPath(payoutId: string, extension: string, fileId: string): string {
  return `versements/${payoutId}/${fileId}.${extension}`;
}

/**
 * Dit pourquoi une devise ne peut pas encore être versée (null : demande possible).
 * @param balance - Solde de la devise
 * @param minimum - Seuil de versement (unités mineures)
 * @param hasDetails - Coordonnées de versement renseignées
 */
export function payoutBlocker(
  balance: AuthorBalance,
  minimum: number,
  hasDetails: boolean,
): PayoutBlocker {
  if (balance.requested > 0) return "open";
  if (balance.available < minimum) return "below_minimum";
  if (!hasDetails) return "no_details";
  return null;
}

/**
 * Premier instant du mois en cours (UTC), pour les chiffres du tableau de bord.
 * @param now - Instant de référence
 * @returns Date ISO du premier jour du mois à minuit UTC
 */
export function monthStart(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
