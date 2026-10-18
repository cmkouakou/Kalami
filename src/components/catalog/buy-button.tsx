/**
 * =============================================================
 *  Fichier    : buy-button.tsx
 *  Projet     : Kalami
 *  Description: Bouton « Acheter » (composant client) : choix de la devise parmi les prix du
 *               livre, création de la commande puis redirection vers la page de paiement
 *               Stripe. Les erreurs sont affichées sous le bouton, en clair.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: api/paiement/checkout, lib/currency.ts
 * =============================================================
 */

"use client";

import { useState } from "react";

import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { Currency, Price } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/currency";

const t = getDictionary();

/** Libellés courts des devises. */
const LABELS: Record<Currency, string> = { XOF: "FCFA", EUR: "€ EUR", CAD: "$ CAD" };

type BuyButtonProps = {
  bookId: string;
  /** Prix disponibles (au moins un) */
  prices: Price[];
  /** Devise proposée d'abord (préférence du visiteur) */
  initialCurrency: Currency;
  className?: string;
};

/** Message lisible pour un code d'erreur renvoyé par l'API. */
function errorMessage(code: unknown): string {
  const errors = t.catalog.purchase.errors as Record<string, string>;
  return typeof code === "string" && code in errors ? errors[code] : errors.generic;
}

/** Bouton d'achat avec choix de la devise. */
export function BuyButton({ bookId, prices, initialCurrency, className }: BuyButtonProps) {
  const fallback = prices.some((p) => p.currency === initialCurrency)
    ? initialCurrency
    : prices[0].currency;
  const [currency, setCurrency] = useState<Currency>(fallback);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const price = prices.find((p) => p.currency === currency) ?? prices[0];

  /**
   * Crée la commande et ouvre la page de paiement Stripe.
   * Le bouton reste désactivé pendant la redirection (évite les doubles commandes).
   */
  async function startCheckout() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/paiement/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, currency }),
      });
      const body = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (response.ok && body?.url) {
        window.location.assign(body.url);
        return;
      }
      setError(errorMessage(body?.error));
    } catch {
      setError(errorMessage(null));
    }
    setPending(false);
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      {prices.length > 1 && (
        <fieldset className="flex flex-wrap items-center gap-2 text-small">
          <legend className="sr-only">{t.catalog.purchase.payIn}</legend>
          <span aria-hidden="true" className="text-ink-muted">
            {t.catalog.purchase.payIn}
          </span>
          {prices.map((p) => (
            <label
              key={p.currency}
              className="flex min-h-11 cursor-pointer items-center gap-1 rounded-md border
                border-line px-3 has-[:checked]:border-encre has-[:checked]:text-encre"
            >
              <input
                type="radio"
                name={`devise-${bookId}`}
                value={p.currency}
                checked={currency === p.currency}
                onChange={() => setCurrency(p.currency)}
                className="sr-only"
              />
              {LABELS[p.currency]}
            </label>
          ))}
        </fieldset>
      )}
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        aria-busy={pending}
        className={`${BUTTON_PRIMARY} w-full`}
      >
        {pending
          ? t.catalog.purchase.redirecting
          : interpolate(t.catalog.purchase.buyIn, {
              price: formatPrice(price.amount_minor, price.currency),
            })}
      </button>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
