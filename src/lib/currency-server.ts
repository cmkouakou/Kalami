/**
 * =============================================================
 *  Fichier    : currency-server.ts
 *  Projet     : Kalami
 *  Description: Devise du visiteur pour la requête courante : cookie « devise » en priorité,
 *               sinon pays détecté par Vercel (en-tête x-vercel-ip-country), sinon EUR.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-07
 *  Dépendances: next/headers, currency.ts
 * =============================================================
 */

import "server-only";

import { cookies, headers } from "next/headers";

import type { Currency } from "@/lib/catalog/types";

import { CURRENCY_COOKIE, currencyForCountry, isCurrency } from "./currency";

/**
 * Détermine la devise d'affichage de la requête courante.
 *
 * Donnée dynamique : à n'appeler que sous une frontière <Suspense>.
 *
 * @returns Devise choisie (cookie) ou déduite du pays
 */
export async function getPreferredCurrency(): Promise<Currency> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(CURRENCY_COOKIE)?.value;
  if (isCurrency(saved)) return saved;

  const headerStore = await headers();
  return currencyForCountry(headerStore.get("x-vercel-ip-country"));
}

/** Durée de vie du cookie de devise : un an. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Pose le cookie de devise, ou le retire (retour à la détection automatique).
 *
 * À appeler uniquement depuis une action serveur ou un gestionnaire de route.
 *
 * @param currency - Devise choisie, ou null pour retirer le cookie
 */
export async function writeCurrencyCookie(currency: Currency | null): Promise<void> {
  const cookieStore = await cookies();
  if (!isCurrency(currency)) {
    cookieStore.delete(CURRENCY_COOKIE);
    return;
  }
  cookieStore.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
