/**
 * =============================================================
 *  Fichier    : offre.ts (cours)
 *  Projet     : Kalami Stratégie — le cours
 *  Description: Offre publique du cours (v0.29.0) : mise en vente et prix dans chaque
 *               devise, lus dans course_settings (lecture publique, écriture par
 *               l'administration).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-19
 *  Dépendances: lib/supabase/server.ts, lib/payments/offers.ts
 * =============================================================
 */

import "server-only";

import { cache } from "react";

import type { Price } from "@/lib/catalog/types";
import { pricesOf } from "@/lib/payments/offers";
import { createClient } from "@/lib/supabase/server";

// ==================== TYPES ====================

/** Offre du cours telle qu'affichée au visiteur. */
export type OffreCours = { enVente: boolean; prix: Price[] };

/** Ligne de réglages lue en base. */
type LigneReglages = {
  on_sale: boolean;
  price_xof: number | null;
  price_eur: number | string | null;
  price_cad: number | string | null;
};

// ==================== LECTURE ====================

/**
 * Convertit une colonne numérique (renvoyée en texte par PostgREST) en nombre.
 * @param valeur - Valeur lue
 */
function nombre(valeur: number | string | null): number | null {
  if (valeur === null) return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/**
 * Offre du cours. Hors vente, ou sans aucun prix, le cours n'est pas proposé à l'achat.
 * @returns Offre ; en cas d'erreur de lecture, cours non proposé
 */
export const lireOffreCours = cache(async (): Promise<OffreCours> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_settings")
      .select("on_sale, price_xof, price_eur, price_cad")
      .maybeSingle<LigneReglages>();
    if (error || !data) return { enVente: false, prix: [] };
    const prix = pricesOf({
      priceXof: data.price_xof,
      priceEur: nombre(data.price_eur),
      priceCad: nombre(data.price_cad),
    });
    return { enVente: data.on_sale && prix.length > 0, prix };
  } catch {
    return { enVente: false, prix: [] };
  }
});
