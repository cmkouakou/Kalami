/**
 * =============================================================
 *  Fichier    : mobile-money-tabs.ts
 *  Projet     : Kalami
 *  Description: Onglets de la page « Paiements Mobile Money » (v0.25.0) : à valider,
 *               validés, refusés, non déclarés. Lecture de l'onglet dans l'adresse et tri
 *               des commandes par onglet. Sans accès à la base : testable seul.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: (aucune)
 * =============================================================
 */

// ==================== ONGLETS ====================

/** Onglets dans l'ordre d'affichage ; le premier est l'onglet par défaut. */
export const MM_TABS = ["to_review", "paid", "failed", "undeclared"] as const;

export type MmTab = (typeof MM_TABS)[number];

/** Champs d'une commande utiles au classement. */
export type MmClassifiable = {
  provider: string;
  status: string;
  mm_declared_at: string | null;
};

// ==================== FONCTIONS ====================

/**
 * Valide l'onglet lu dans l'adresse (?onglet=…).
 * @param raw - Valeur brute
 * @returns Onglet connu, « à valider » par défaut
 */
export function parseMmTab(raw: unknown): MmTab {
  return MM_TABS.find((tab) => tab === raw) ?? "to_review";
}

/**
 * Onglet d'une commande Mobile Money, ou null pour une autre commande (Stripe, remboursée,
 * expirée).
 * @param order - Commande à classer
 */
export function mmTabOf(order: MmClassifiable): MmTab | null {
  if (order.provider !== "mobile_money") return null;
  if (order.status === "paid") return "paid";
  if (order.status === "failed") return "failed";
  if (order.status !== "pending") return null;
  return order.mm_declared_at ? "to_review" : "undeclared";
}

/**
 * Répartit les commandes par onglet, en gardant l'ordre reçu (plus récentes d'abord).
 * @param orders - Commandes de toute la boutique
 */
export function groupByMmTab<T extends MmClassifiable>(orders: T[]): Record<MmTab, T[]> {
  const groups: Record<MmTab, T[]> = { to_review: [], paid: [], failed: [], undeclared: [] };
  for (const order of orders) {
    const tab = mmTabOf(order);
    if (tab) groups[tab].push(order);
  }
  return groups;
}
