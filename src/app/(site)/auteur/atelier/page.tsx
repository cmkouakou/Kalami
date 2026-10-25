/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/atelier)
 *  Projet     : Kalami
 *  Description: Atelier de l'auteur (v0.15.0) : solde de Crédits Atelier (pourcentage et
 *               chapitres, jamais de dollars), forfaits en vente (carte ou Mobile Money) et
 *               accès à l'atelier de chacun de ses livres.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-25
 *  Dépendances: lib/author/workshop/queries.ts, lib/author/queries.ts,
 *               lib/author/workshop/balance.ts, components/catalog/buy-button.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BuyButton } from "@/components/catalog/buy-button";
import { CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { listAuthorBooks, requireAuthor } from "@/lib/author/queries";
import { balanceMessage } from "@/lib/author/workshop/balance";
import { getWorkshopBalance, listWorkshopOffers } from "@/lib/author/workshop/queries";
import { getPreferredCurrency } from "@/lib/currency-server";
import { pricesOf } from "@/lib/payments/offers";

const w = getDictionary().workshop;

export const metadata: Metadata = { title: w.title };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function WorkshopPage({ searchParams }: PageProps) {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold">{w.title}</h1>
      <p className="text-ink-muted">{w.intro}</p>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <WorkshopContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** Solde, forfaits et livres de l'auteur connecté. */
async function WorkshopContent({ searchParams }: PageProps) {
  const { author } = await requireAuthor("/auteur/atelier");
  const [balance, offers, books, currency, query] = await Promise.all([
    getWorkshopBalance(),
    listWorkshopOffers(),
    listAuthorBooks(author.id),
    getPreferredCurrency(),
    searchParams,
  ]);

  return (
    <>
      {query.paiement === "annule" && (
        <p role="status" className="rounded-lg bg-warning/15 p-4 text-sm">
          {w.cancelled}
        </p>
      )}

      {/* ==================== SOLDE ==================== */}
      <section className={`${CARD} flex flex-col gap-3 p-6`}>
        <h2 className="text-lg font-semibold">{w.balance.title}</h2>
        <label className="flex flex-col gap-2 text-sm">
          {balanceMessage(balance)}
          {balance.unlocked && (
            <progress className="h-2 w-full" value={balance.remainingPct} max={100} />
          )}
        </label>
      </section>

      {/* ==================== FORFAITS ==================== */}
      {balance.enabled && (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-h2 font-semibold">{w.offers.title}</h2>
          {offers.length === 0 ? (
            <p className="text-ink-muted">{w.offers.none}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {offers.map((offer) => {
                const prices = pricesOf(offer);
                return (
                  <li key={offer.id} className={`${CARD} flex flex-col gap-2 p-4`}>
                    <h3 className="font-semibold">{offer.name}</h3>
                    <p className="text-ink-muted">
                      {interpolate(w.offers.approx, { count: String(offer.approxChapters) })}
                    </p>
                    {prices.length > 0 && (
                      <BuyButton
                        item={{ item: "workshop_pack", packId: offer.id }}
                        groupName={`atelier-${offer.id}`}
                        prices={prices}
                        initialCurrency={currency}
                        className="mt-auto"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* ==================== LIVRES ==================== */}
      <section className={`${PANEL_SAND} flex flex-col gap-3 p-6`}>
        <h2 className="text-lg font-semibold">{w.books.title}</h2>
        {books.length === 0 ? (
          <p className="text-sm text-ink-muted">{w.books.none}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {books.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/auteur/livres/${book.id}/atelier`}
                  className="inline-flex min-h-11 items-center text-encre hover:underline"
                >
                  {book.title} — {w.books.open}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
