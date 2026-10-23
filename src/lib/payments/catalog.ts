/**
 * =============================================================
 *  Fichier    : catalog.ts
 *  Projet     : Kalami
 *  Description: Correspondance entre les articles vendus et les prix Stripe (price_…) créés
 *               dans le tableau de bord. Ces prix n'existent qu'en CAD : ils servent seulement à
 *               retrouver le produit Stripe ; le montant facturé vient toujours de la base.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: variables STRIPE_PRICE_* (voir .env.example), stripe.ts
 * =============================================================
 */

import "server-only";

import { productOfPrice } from "@/lib/payments/stripe";

// ==================== CORRESPONDANCES ====================

/** Article vendu : livre (par slug), étude, lot, forfait du coach ou cas d'entraînement. */
export type SaleItemKey =
  | { kind: "book"; slug: string }
  | { kind: "study" }
  | { kind: "study_lot"; size: 10 | 30 }
  | { kind: "coach_pack"; level: "essentiel" | "approfondi" | "intensif" }
  | { kind: "practice_case"; code: string };

/** Livres ayant un produit Stripe dédié ; les autres sont décrits à la volée. */
const BOOK_PRICE_ENV: Record<string, string> = {
  "la-strategie-d-entreprise": "STRIPE_PRICE_LIVRE_STRATEGIE",
};

/**
 * Nom de la variable d'environnement qui porte le prix Stripe d'un article.
 * @param item - Article vendu
 * @returns Nom de la variable, ou null si l'article n'a pas de produit dédié
 */
export function priceEnvName(item: SaleItemKey): string | null {
  switch (item.kind) {
    case "book":
      return BOOK_PRICE_ENV[item.slug] ?? null;
    case "study":
      return "STRIPE_PRICE_ETUDE";
    case "study_lot":
      return `STRIPE_PRICE_LOT_${item.size}`;
    case "coach_pack":
      return `STRIPE_PRICE_COACH_${item.level.toUpperCase()}`;
    case "practice_case":
      return `STRIPE_PRICE_CAS_${item.code.toUpperCase().replace(/-/g, "_")}`;
  }
}

// ==================== RÉSOLUTION DU PRODUIT ====================

/** Produits déjà résolus (un appel Stripe par prix et par instance du serveur). */
const productCache = new Map<string, string>();

/**
 * Produit Stripe (prod_…) d'un article, pour regrouper les ventes dans le tableau de bord.
 * @param item - Article vendu
 * @returns Identifiant du produit, ou null (variable absente ou prix introuvable)
 */
export async function stripeProductFor(item: SaleItemKey): Promise<string | null> {
  const envName = priceEnvName(item);
  const priceId = envName ? process.env[envName]?.trim() : undefined;
  if (!priceId || !priceId.startsWith("price_")) return null;

  const cached = productCache.get(priceId);
  if (cached) return cached;
  const productId = await productOfPrice(priceId);
  if (productId) productCache.set(priceId, productId);
  return productId;
}
