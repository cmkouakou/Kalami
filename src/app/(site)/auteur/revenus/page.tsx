/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/revenus)
 *  Projet     : Kalami
 *  Description: Revenus de l'auteur (Sprint 10a, v0.12.0) : part appliquée, délai de
 *               disponibilité et seuils de versement, soldes par devise (disponible, en
 *               attente, total) et dernières écritures du grand livre. Les demandes de
 *               versement arrivent au Sprint 10b.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/author/queries.ts, lib/revenue/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BADGE, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireAuthor } from "@/lib/author/queries";
import { formatPrice } from "@/lib/currency";
import { type AuthorBalance, bpsToPercent, isAvailable } from "@/lib/revenue/ledger";
import {
  getAuthorBalances,
  getAuthorShareBps,
  getRevenueSettings,
  listAuthorEntries,
} from "@/lib/revenue/queries";

const t = getDictionary();
const r = t.author.revenue;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export const metadata: Metadata = { title: r.title };

export default function AuthorRevenuePage() {
  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold">{r.title}</h1>
        <p className="text-ink-muted">{r.intro}</p>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-64 animate-pulse" />}>
        <Revenue />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Réglages, soldes et écritures de l'auteur connecté. */
async function Revenue() {
  const { author } = await requireAuthor("/auteur/revenus");
  const [settings, balances, entries] = await Promise.all([
    getRevenueSettings(),
    getAuthorBalances(),
    listAuthorEntries(author.id),
  ]);
  const shareBps = await getAuthorShareBps(author.id, settings.authorShareBps);

  return (
    <>
      {/* ==================== CONDITIONS ==================== */}
      <section className={`${PANEL_SAND} flex flex-col gap-1 p-5 text-sm`}>
        <p>{interpolate(r.share, { share: bpsToPercent(shareBps) })}</p>
        <p>{interpolate(r.hold, { days: String(settings.holdDays) })}</p>
        <p>
          {interpolate(r.minimum, {
            xof: formatPrice(settings.payoutMin.XOF, "XOF"),
            eur: formatPrice(settings.payoutMin.EUR, "EUR"),
            cad: formatPrice(settings.payoutMin.CAD, "CAD"),
          })}
        </p>
        <p className="text-ink-muted">
          {r.payoutsSoon}{" "}
          <Link href="/auteur/profil" className="font-medium text-encre underline">
            {r.payoutDetails}
          </Link>
        </p>
      </section>

      {/* ==================== SOLDES ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{r.balancesTitle}</h2>
        {balances.length === 0 ? (
          <p className="text-ink-muted">{r.none}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((balance) => (
              <BalanceCard key={balance.currency} balance={balance} />
            ))}
          </ul>
        )}
      </section>

      {/* ==================== ÉCRITURES ==================== */}
      {entries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{r.entriesTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{r.date}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{r.book}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{r.type}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{r.gross}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{r.yourShare}</th>
                  <th scope="col" className="py-2 font-medium">{r.availableAt}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-line">
                    <td className="py-2 pr-3">{DATE_FORMAT.format(new Date(entry.created_at))}</td>
                    <td className="py-2 pr-3">{entry.label}</td>
                    <td className="py-2 pr-3">
                      <span className={BADGE}>{r.types[entry.entry_type]}</span>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {formatPrice(entry.gross_minor, entry.currency)}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium">
                      {formatPrice(entry.author_minor, entry.currency)}
                    </td>
                    <td className="py-2">
                      {isAvailable(entry.available_at)
                        ? r.available
                        : DATE_FORMAT.format(new Date(entry.available_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

/** Solde d'une devise : disponible, en attente, total et volume des ventes. */
function BalanceCard({ balance }: { balance: AuthorBalance }) {
  const money = (amount: number) => formatPrice(amount, balance.currency);
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <p className="text-sm text-ink-muted">{r.available}</p>
      <p className="font-serif text-2xl font-semibold">{money(balance.available)}</p>
      <dl className="grid grid-cols-2 gap-1 text-sm">
        <dt className="text-ink-muted">{r.pending}</dt>
        <dd className="text-right">{money(balance.pending)}</dd>
        <dt className="text-ink-muted">{r.earned}</dt>
        <dd className="text-right">{money(balance.earned)}</dd>
      </dl>
      <p className="text-xs text-ink-muted">
        {interpolate(r.sales, { count: String(balance.sales), gross: money(balance.gross) })}
      </p>
    </li>
  );
}
