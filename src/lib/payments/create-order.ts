/**
 * =============================================================
 *  Fichier    : create-order.ts
 *  Projet     : Kalami
 *  Description: Création d'une commande au nom de l'acheteur connecté, commune à la carte
 *               (Stripe) et au Mobile Money : la base vérifie prix, droits, code promo,
 *               remise enseignant et cadence (create_book_order, create_strategy_order).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/checkout-request.ts, lib/payments/promo.ts,
 *               lib/supabase/server.ts
 * =============================================================
 */

import "server-only";

import { PRIVATE_HEADERS } from "@/lib/content/responses";
import type { CheckoutBody } from "@/lib/payments/checkout-request";
import { PROMO_ERRORS } from "@/lib/payments/promo";
import { createClient } from "@/lib/supabase/server";

/** Statut HTTP de chaque refus de la base. */
export const ORDER_ERROR_STATUS: Record<string, number> = {
  invalid_currency: 400,
  not_for_sale: 404,
  not_allowed: 403,
  already_owned: 409,
  rate_limited: 429,
  ...Object.fromEntries(PROMO_ERRORS.map((code) => [code, 400])),
};

export type OrderRow = { order_id: string; total_minor: number; label: string };

/**
 * Réponse JSON d'erreur de paiement.
 * @param code - Code lu par l'interface (already_owned, rate_limited…)
 * @param status - Statut HTTP
 */
export function paymentError(code: string, status: number): Response {
  return Response.json({ error: code }, { status, headers: PRIVATE_HEADERS });
}

/**
 * Crée la commande au nom de l'acheteur : la base vérifie prix, droits et cadence.
 * @param body - Demande validée
 */
export async function createOrder(body: CheckoutBody) {
  const supabase = await createClient();
  const promo = body.promoCode ?? null;
  if (body.item === "book") {
    return supabase
      .rpc("create_book_order", {
        p_book_id: body.bookId,
        p_currency: body.currency,
        p_promo_code: promo,
      })
      .single<OrderRow>();
  }
  return supabase
    .rpc("create_strategy_order", {
      p_kind: body.item,
      p_currency: body.currency,
      p_code: body.item === "study_offer" || body.item === "practice_case" ? body.code : null,
      p_pack_id: body.item === "coach_pack" ? body.packId : null,
      p_study_id: body.item === "coach_pack" ? body.studyId : null,
      p_promo_code: promo,
    })
    .single<OrderRow>();
}

/**
 * Réponse d'erreur pour une commande refusée par la base (code connu ou erreur 500).
 * @param error - Erreur renvoyée par la fonction de commande
 */
export function orderRefusal(error: { code?: string; message?: string } | null): Response {
  const code = error?.message ?? "";
  if (code in ORDER_ERROR_STATUS) return paymentError(code, ORDER_ERROR_STATUS[code]);
  console.error("[paiement] commande refusée :", error?.code, error?.message);
  return paymentError("order_failed", 500);
}
