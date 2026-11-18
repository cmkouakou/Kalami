/**
 * =============================================================
 *  Fichier    : mm-notice.ts
 *  Projet     : Kalami
 *  Description: Avis Mobile Money dans l'application (v0.25.4) : nom du témoin qui retient
 *               le dernier avis vu, et choix de l'avis à montrer (décision, texte, lien).
 *               Sans accès à la base : utilisable côté client et testé seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-18
 *  Dépendances: lib/payments/queries.ts (types et lien de l'article)
 * =============================================================
 */

import type { OrderItemLink, OrderSummary } from "./queries";

// ==================== CONSTANTES ====================

/** Témoin : identifiant de la dernière commande dont l'avis a été vu. */
export const MM_NOTICE_COOKIE = "kalami_mm_vu";

/** Durée de conservation du témoin (30 jours, plus que la fenêtre de l'avis). */
export const MM_NOTICE_MAX_AGE_S = 30 * 24 * 60 * 60;

// ==================== TYPES ====================

export type MobileMoneyNotice = {
  orderId: string;
  outcome: "paid" | "rejected";
  label: string;
  href: string;
};

// ==================== FONCTIONS ====================

/**
 * Avis à montrer pour la dernière décision Mobile Money.
 *
 * Description : rien si aucune décision ou si l'acheteur l'a déjà vue ; sinon un avis
 * « confirmé » qui mène à l'achat débloqué, ou « refusé » qui mène à la commande (motif).
 *
 * @param order    - Dernière commande Mobile Money décidée, ou null
 * @param seenId   - Valeur du témoin (dernière commande vue), ou undefined
 * @param linkOf   - Lien vers ce que débloque un article (orderItemLink)
 * @returns Avis, ou null
 */
export function pickMobileMoneyNotice(
  order: OrderSummary | null,
  seenId: string | undefined,
  linkOf: (item: OrderSummary["items"][number]) => OrderItemLink | null,
): MobileMoneyNotice | null {
  if (!order || order.provider !== "mobile_money" || order.id === seenId) return null;
  const item = order.items[0];
  const label = item?.label ?? "—";
  const orderHref = `/compte/achats/${order.id}`;
  if (order.status === "paid") {
    const link = item ? linkOf(item) : null;
    return { orderId: order.id, outcome: "paid", label, href: link?.href ?? orderHref };
  }
  if (order.status === "failed") {
    return { orderId: order.id, outcome: "rejected", label, href: orderHref };
  }
  return null;
}
