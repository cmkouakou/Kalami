/**
 * =============================================================
 *  Fichier    : page.tsx (auteur/revenus)
 *  Projet     : Kalami
 *  Description: Revenus de l'auteur (Sprint 10a, v0.12.0) : part appliquée, délai de
 *               disponibilité et seuils de versement, soldes par devise (disponible, en
 *               attente, total) et dernières écritures du grand livre. v1.1 (Sprint 10b) :
 *               demande de versement par devise, demandes en cours et historique.
 *  Auteur     : Claude Marcel
 *  Version    : 1.1
 *  Date       : 2026-10-19
 *  Dépendances: lib/author/queries.ts, lib/revenue/queries.ts, lib/revenue/payout-*.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { BADGE, CARD, PANEL_SAND } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireAuthor } from "@/lib/author/queries";
import { formatPrice } from "@/lib/currency";
import { type AuthorBalance, bpsToPercent, isAvailable } from "@/lib/revenue/ledger";
import { cancelPayout, requestPayout } from "@/lib/revenue/payout-actions";
import { hasPayoutDetails, listAuthorPayouts } from "@/lib/revenue/payout-queries";
import { payoutBlocker, type PayoutRequest } from "@/lib/revenue/payouts";
import {
  getAuthorBalances,
  getAuthorShareBps,
  getRevenueSettings,
  listAuthorEntries,
} from "@/lib/revenue/queries";
import { DATE_FORMAT } from "@/lib/format/date";

const t = getDictionary();
const r = t.author.revenue;

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
  const [settings, balances, entries, payouts, hasDetails] = await Promise.all([
    getRevenueSettings(),
    getAuthorBalances(),
    listAuthorEntries(author.id),
    listAuthorPayouts(author.id),
    hasPayoutDetails(author.id),
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
          {r.payoutsIntro}{" "}
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
              <BalanceCard
                key={balance.currency}
                balance={balance}
                minimum={settings.payoutMin[balance.currency]}
                hasDetails={hasDetails}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ==================== DEMANDES DE VERSEMENT ==================== */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{r.payoutsTitle}</h2>
        {payouts.length === 0 ? (
          <p className="text-ink-muted">{r.payoutsNone}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
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

type BalanceCardProps = { balance: AuthorBalance; minimum: number; hasDetails: boolean };

/** Solde d'une devise : disponible, en attente, versements, puis demande ou blocage. */
function BalanceCard({ balance, minimum, hasDetails }: BalanceCardProps) {
  const money = (amount: number) => formatPrice(amount, balance.currency);
  const blocker = payoutBlocker(balance, minimum, hasDetails);
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <p className="text-sm text-ink-muted">{r.available}</p>
      <p className="font-serif text-2xl font-semibold">{money(balance.available)}</p>
      <dl className="grid grid-cols-2 gap-1 text-sm">
        <dt className="text-ink-muted">{r.pending}</dt>
        <dd className="text-right">{money(balance.pending)}</dd>
        <dt className="text-ink-muted">{r.earned}</dt>
        <dd className="text-right">{money(balance.earned)}</dd>
        {balance.requested > 0 && (
          <>
            <dt className="text-ink-muted">{r.requested}</dt>
            <dd className="text-right">{money(balance.requested)}</dd>
          </>
        )}
        {balance.paid > 0 && (
          <>
            <dt className="text-ink-muted">{r.paid}</dt>
            <dd className="text-right">{money(balance.paid)}</dd>
          </>
        )}
      </dl>
      <p className="text-xs text-ink-muted">
        {interpolate(r.sales, { count: String(balance.sales), gross: money(balance.gross) })}
      </p>
      {blocker === null ? (
        <ActionForm
          action={requestPayout.bind(null, balance.currency)}
          submitLabel={interpolate(r.request, { amount: money(balance.available) })}
        >
          {null}
        </ActionForm>
      ) : (
        <p className="text-sm text-ink-muted">
          {blocker === "below_minimum"
            ? interpolate(r.blockers.below_minimum, { minimum: money(minimum) })
            : r.blockers[blocker]}
        </p>
      )}
    </li>
  );
}

/** Une demande de versement : montant, statut, résultat ou bouton d'annulation. */
function PayoutRow({ payout }: { payout: PayoutRequest }) {
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4 text-sm`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-xs text-ink-muted">{payout.reference}</span>
        <span className="flex items-center gap-3">
          <span className="font-semibold">
            {formatPrice(payout.amount_minor, payout.currency)}
          </span>
          <span className={BADGE}>{r.statuses[payout.status]}</span>
        </span>
      </div>
      <p className="text-ink-muted">
        {r.requestedOn} {DATE_FORMAT.format(new Date(payout.created_at))}
      </p>
      {payout.status === "paid" && (
        <p>
          {interpolate(r.paidOn, {
            date: payout.paid_at ? DATE_FORMAT.format(new Date(payout.paid_at)) : "—",
            reference: payout.payment_reference ?? "—",
          })}
        </p>
      )}
      {payout.status === "rejected" && (
        <p>{interpolate(r.rejectedBecause, { reason: payout.rejection_reason ?? "—" })}</p>
      )}
      {payout.status === "requested" && (
        <ActionForm action={cancelPayout.bind(null, payout.id)} submitLabel={r.cancel}>
          {null}
        </ActionForm>
      )}
    </li>
  );
}
