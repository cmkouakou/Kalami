/**
 * =============================================================
 *  Fichier    : checkout-request.ts
 *  Projet     : Kalami
 *  Description: Lecture du corps d'une demande d'achat (livre, étude ou lot d'études,
 *               forfait du coach, cas d'entraînement depuis la v0.14.0, code promo
 *               facultatif depuis la v0.10.3) et adresse de retour si le paiement est
 *               abandonné.
 *               Fonctions pures : le prix et les droits sont vérifiés par la base.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-23
 *  Dépendances: lib/admin/validation.ts, lib/currency.ts, catalog.ts
 * =============================================================
 */

import { isUuid } from "@/lib/admin/validation";
import type { Currency } from "@/lib/catalog/types";
import { isCurrency } from "@/lib/currency";
import type { SaleItemKey } from "@/lib/payments/catalog";
import { normalizePromoCode } from "@/lib/payments/promo";

// ==================== TYPES ====================

/** Offres d'étude Stratégie (codes de la table strategy_offers). */
export const STUDY_OFFER_CODES = ["study", "lot_10", "lot_30"] as const;
export type StudyOfferCode = (typeof STUDY_OFFER_CODES)[number];

/** Article demandé, validé dans sa forme (pas encore dans son prix ni ses droits). */
export type CheckoutItem =
  | { item: "book"; bookId: string }
  | { item: "study_offer"; code: StudyOfferCode }
  | { item: "coach_pack"; packId: string; studyId: string }
  | { item: "practice_case"; code: string };

export type CheckoutBody = CheckoutItem & { currency: Currency; promoCode?: string };

/** Forme d'un code de cas d'entraînement (table practice_cases). */
const CASE_CODE = /^[a-z0-9-]{2,40}$/;

/** Niveaux de forfait ayant un produit Stripe dédié. */
const PACK_LEVELS = ["essentiel", "approfondi", "intensif"] as const;

// ==================== LECTURE DU CORPS ====================

/**
 * Valide le corps JSON d'une demande d'achat.
 * Sans champ « item », un corps { bookId } reste compris comme l'achat d'un livre (v0.10.0).
 * @param raw - Corps JSON reçu
 * @returns Demande valide, ou null
 *
 * Exemple :
 *   parseCheckoutBody({ item: "study_offer", code: "lot_10", currency: "CAD" })
 */
export function parseCheckoutBody(raw: unknown): CheckoutBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (!isCurrency(body.currency)) return null;
  const item = parseItem(body);
  if (!item) return null;

  // Code promo facultatif : absent ou vide → aucun ; mal formé → demande refusée
  if (body.promoCode === undefined || body.promoCode === null || body.promoCode === "") {
    return { ...item, currency: body.currency };
  }
  const promoCode = normalizePromoCode(body.promoCode);
  return promoCode ? { ...item, currency: body.currency, promoCode } : null;
}

/**
 * Article d'une demande d'achat (sans la devise ni le code promo).
 * @param body - Corps JSON
 * @returns Article valide dans sa forme, ou null
 */
function parseItem(body: Record<string, unknown>): CheckoutItem | null {
  const item = body.item ?? "book";
  if (item === "book" && isUuid(body.bookId)) {
    return { item, bookId: body.bookId };
  }
  if (
    item === "study_offer" &&
    (STUDY_OFFER_CODES as readonly unknown[]).includes(body.code)
  ) {
    return { item, code: body.code as StudyOfferCode };
  }
  if (item === "coach_pack" && isUuid(body.packId) && isUuid(body.studyId)) {
    return { item, packId: body.packId, studyId: body.studyId };
  }
  if (item === "practice_case" && typeof body.code === "string" && CASE_CODE.test(body.code)) {
    return { item, code: body.code };
  }
  return null;
}

// ==================== CORRESPONDANCES ====================

/**
 * Article du catalogue Stripe d'une offre d'étude.
 * @param code - Code de l'offre
 */
export function studyOfferSaleItem(code: StudyOfferCode): SaleItemKey {
  if (code === "study") return { kind: "study" };
  return { kind: "study_lot", size: code === "lot_10" ? 10 : 30 };
}

/**
 * Article du catalogue Stripe d'un forfait, d'après le premier mot de son nom.
 * @param packName - Nom du forfait (« Essentiel », « Approfondi »…)
 * @returns Article, ou null si le forfait n'a pas de produit dédié
 */
export function coachPackSaleItem(packName: string): SaleItemKey | null {
  const first = packName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const level = PACK_LEVELS.find((name) => name === first);
  return level ? { kind: "coach_pack", level } : null;
}

/**
 * Chemin de retour si l'acheteur abandonne le paiement.
 * @param item - Article demandé
 * @param bookSlug - Slug du livre (achat d'un livre)
 */
export function cancelPathFor(item: CheckoutItem, bookSlug: string | null): string {
  switch (item.item) {
    case "book":
      return `/livres/${bookSlug ?? ""}?paiement=annule`;
    case "study_offer":
      return "/strategie?paiement=annule";
    case "coach_pack":
      return `/strategie/etudes/${item.studyId}/coach?paiement=annule`;
    case "practice_case":
      return `/strategie/cas/${item.code}?paiement=annule`;
  }
}
