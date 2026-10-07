/**
 * =============================================================
 *  Fichier    : currency-selector.tsx
 *  Projet     : Kalami
 *  Description: Sélecteur de devise de l'en-tête (XOF, EUR, CAD). Lit la devise de la
 *               requête : à placer sous une frontière <Suspense>.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: currency-select.tsx, lib/currency-server.ts
 * =============================================================
 */

import { getPreferredCurrency } from "@/lib/currency-server";

import { CurrencySelect } from "./currency-select";

/** Sélecteur prérempli avec la devise courante du visiteur. */
export async function CurrencySelector() {
  const currency = await getPreferredCurrency();
  return <CurrencySelect current={currency} />;
}
