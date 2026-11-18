/**
 * =============================================================
 *  Fichier    : order-display.ts
 *  Projet     : Kalami
 *  Description: Règles d'affichage des commandes de l'acheteur (v0.25.4), sans accès à la
 *               base : une commande par carte non terminée disparaît de « Mes achats » dès
 *               que le même article est payé ou que sa session Stripe a expiré (1 h) ;
 *               sinon elle est présentée comme « paiement par carte non terminé ».
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/payments/queries.ts (types seulement)
 * =============================================================
 */

import type { OrderItemSummary, OrderSummary } from "./queries";

// ==================== CONSTANTES ====================

/** Durée de vie d'une session de paiement Stripe (voir SESSION_TTL_S de stripe.ts). */
export const CARD_SESSION_TTL_MS = 60 * 60 * 1000;

// ==================== FONCTIONS ====================

/**
 * Clé d'un article : deux commandes du même article ont la même clé.
 * @param item - Article de la commande
 * @returns Clé stable (type, livre, étude, crédits, cas)
 */
export function itemKey(item: OrderItemSummary | undefined): string {
  if (!item) return "";
  return [
    item.kind,
    item.book?.slug ?? "",
    item.study_id ?? "",
    item.credits ?? "",
    item.practice_case ?? "",
  ].join("|");
}

/**
 * Commande par carte encore en attente (session Stripe ouverte ou abandonnée).
 * @param order - Commande
 */
export function isPendingCard(order: OrderSummary): boolean {
  return order.provider !== "mobile_money" && order.status === "pending";
}

/**
 * Commandes à montrer dans « Mes achats ».
 *
 * Description : retire les commandes par carte en attente devenues inutiles — session
 * expirée (plus d'une heure) ou même article déjà payé par un autre moyen.
 *
 * @param orders - Commandes de l'acheteur
 * @param now    - Instant de référence (tests)
 * @returns Commandes visibles, dans le même ordre
 *
 * Exemple d'utilisation :
 *   const visibles = visibleOrders(await getMyOrders());
 */
export function visibleOrders(orders: OrderSummary[], now: Date = new Date()): OrderSummary[] {
  const paidKeys = new Set(
    orders.filter((order) => order.status === "paid").map((order) => itemKey(order.items[0])),
  );
  return orders.filter((order) => {
    if (!isPendingCard(order)) return true;
    const age = now.getTime() - new Date(order.created_at).getTime();
    if (age >= CARD_SESSION_TTL_MS) return false;
    return !paidKeys.has(itemKey(order.items[0]));
  });
}
