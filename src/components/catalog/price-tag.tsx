/**
 * =============================================================
 *  Fichier    : price-tag.tsx
 *  Projet     : Kalami
 *  Description: Prix d'un livre dans la devise du visiteur. La devise dépend de la requête
 *               (cookie, pays) : le prix est rendu en flux, sous sa propre frontière
 *               <Suspense>, pendant que le reste de la page reste statique et en cache.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-09
 *  Dépendances: lib/currency.ts, lib/currency-server.ts
 * =============================================================
 */

import { Suspense } from "react";

import { getDictionary } from "@/i18n";
import type { Price } from "@/lib/catalog/types";
import { formatPrice, pickPrice } from "@/lib/currency";
import { getPreferredCurrency } from "@/lib/currency-server";

const t = getDictionary();

type PriceTagProps = {
  prices: Price[];
  className?: string;
};

/** Prix formaté, ou « Prix à venir » si le livre n'est pas vendu dans cette devise. */
async function PriceValue({ prices, className }: PriceTagProps) {
  const currency = await getPreferredCurrency();
  const price = pickPrice(prices, currency);

  if (!price) {
    return (
      <span className={`text-ink-muted ${className ?? ""}`}>{t.catalog.priceUnavailable}</span>
    );
  }
  return (
    <span className={`font-semibold ${className ?? ""}`}>
      {formatPrice(price.amount_minor, price.currency)}
    </span>
  );
}

/** Prix avec emplacement réservé pendant le chargement (évite les sauts de mise en page). */
export function PriceTag(props: PriceTagProps) {
  return (
    <Suspense
      fallback={
        <span
          aria-hidden="true"
          className={`inline-block h-[1lh] w-16 animate-pulse rounded-sm bg-line
            ${props.className ?? ""}`}
        />
      }
    >
      <PriceValue {...props} />
    </Suspense>
  );
}
