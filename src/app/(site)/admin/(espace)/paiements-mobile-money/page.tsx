/**
 * =============================================================
 *  Fichier    : page.tsx (admin/paiements-mobile-money)
 *  Projet     : Kalami
 *  Description: Paiements Mobile Money (v0.25.0) : onglets « À valider », « Validés »,
 *               « Refusés » et « Non déclarés » (?onglet=…), avec leur nombre. Les paiements
 *               déclarés se valident ou se refusent ici. Bouton d'autorisation des
 *               notifications du navigateur ; la veille du gabarit rafraîchit la page.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/order-queries.ts, lib/admin/mobile-money-tabs.ts,
 *               components/admin/mobile-money-order.tsx, components/admin/payment-watcher.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MobileMoneyDetails, MobileMoneyReview } from "@/components/admin/mobile-money-order";
import { MM_PAYMENTS_HREF, NotificationSwitch } from "@/components/admin/payment-watcher";
import { BADGE, CARD, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { MM_TABS, type MmTab, parseMmTab } from "@/lib/admin/mobile-money-tabs";
import { type AdminOrderRow, listMobileMoneyPayments } from "@/lib/admin/order-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { DATE_TIME_FORMAT } from "@/lib/format/date";

const p = getDictionary().admin.mmPayments;

export const metadata: Metadata = { title: p.title };

export default function MobileMoneyPaymentsPage(
  props: PageProps<"/admin/paiements-mobile-money">,
) {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{p.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{p.intro}</p>
        <NotificationSwitch />
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <Payments {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Onglets et paiements de l'onglet choisi (administrateur aal2). */
async function Payments({ searchParams }: PageProps<"/admin/paiements-mobile-money">) {
  await requireAdmin();
  const tab = parseMmTab((await searchParams).onglet);
  const groups = await listMobileMoneyPayments();
  const orders = groups[tab];

  return (
    <>
      <nav aria-label={p.tabsLabel}>
        <ul className="flex flex-wrap gap-2">
          {MM_TABS.map((value) => (
            <li key={value}>
              <Link
                href={tabHref(value)}
                className={value === tab ? PILL_ACTIVE : PILL}
                aria-current={value === tab ? "page" : undefined}
              >
                {p.tabs[value]} ({groups[value].length})
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="max-w-3xl text-small text-ink-muted">{p.tabIntros[tab]}</p>
      {orders.length === 0 ? (
        <p className="text-ink-muted">{p.none[tab]}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <PaymentRow key={order.id} order={order} tab={tab} />
          ))}
        </ul>
      )}
    </>
  );
}

/** Adresse d'un onglet ; « à valider » est l'adresse nue (lien des courriels). */
function tabHref(tab: MmTab): string {
  return tab === "to_review" ? MM_PAYMENTS_HREF : `${MM_PAYMENTS_HREF}?onglet=${tab}`;
}

/** Un paiement : articles, montant, acheteur, date, transaction et décision. */
function PaymentRow({ order, tab }: { order: AdminOrderRow; tab: MmTab }) {
  const date = tab === "paid" ? (order.paid_at ?? order.created_at) : order.created_at;
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">
          {order.labels ?? "—"}
          {tab === "to_review" && <span className={`${BADGE} ml-2`}>{p.tabs.to_review}</span>}
        </span>
        <span className="text-ocre-text">{formatPrice(order.total_minor, order.currency)}</span>
      </div>
      <p className="break-all text-small text-ink-muted">
        {order.buyer_email ?? "—"} ·{" "}
        {interpolate(tab === "paid" ? p.paidOn : p.createdOn, {
          date: DATE_TIME_FORMAT.format(new Date(date)),
        })}
      </p>
      <MobileMoneyDetails order={order} />
      {tab === "to_review" && <MobileMoneyReview order={order} />}
    </li>
  );
}
