/**
 * =============================================================
 *  Fichier    : offers.ts
 *  Projet     : Kalami
 *  Description: Prix d'une offre Stratégie (étude, lot, forfait du coach) dans chaque devise,
 *               en unité mineure, avec la remise enseignant éventuelle. Même calcul que la
 *               base (price_to_minor et create_strategy_order) : l'affichage correspond au
 *               montant facturé.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/catalog/types.ts
 * =============================================================
 */

import type { Price } from "@/lib/catalog/types";

// ==================== TYPES ====================

/** Prix saisis par l'auteur (FCFA entiers, euros et dollars canadiens décimaux). */
export type OfferPrices = {
  priceXof: number | null;
  priceEur: number | null;
  priceCad: number | null;
};

// ==================== CALCUL ====================

/**
 * Prix disponibles d'une offre, en unité mineure, remise déduite.
 * @param offer - Prix saisis (une devise vide n'est pas proposée)
 * @param discountPct - Remise en pourcentage (0 à 90)
 * @returns Prix dans l'ordre FCFA, euro, dollar canadien
 *
 * Exemple :
 *   pricesOf({ priceXof: 3500, priceEur: 6.99, priceCad: 9.99 }, 20)
 *   → [{ XOF, 2800 }, { EUR, 559 }, { CAD, 799 }]
 */
export function pricesOf(offer: OfferPrices, discountPct = 0): Price[] {
  const raw: [Price["currency"], number | null][] = [
    ["XOF", offer.priceXof],
    ["EUR", offer.priceEur === null ? null : Math.round(offer.priceEur * 100)],
    ["CAD", offer.priceCad === null ? null : Math.round(offer.priceCad * 100)],
  ];
  return raw
    .filter((entry): entry is [Price["currency"], number] => entry[1] !== null)
    .map(([currency, amount]) => ({
      currency,
      amount_minor: Math.round((amount * (100 - discountPct)) / 100),
    }));
}
