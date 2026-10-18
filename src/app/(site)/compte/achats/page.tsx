/**
 * =============================================================
 *  Fichier    : page.tsx (compte/achats)
 *  Projet     : Kalami
 *  Description: « Mes achats » : commandes payées ou en cours de confirmation, montant,
 *               date, lien de lecture et reçu Stripe.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-18
 *  Dépendances: lib/payments/queries.ts, lib/currency.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { getMyOrders, type OrderSummary } from "@/lib/payments/queries";

const t = getDictionary();
const tp = t.account.purchases;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export const metadata: Metadata = { title: tp.title, robots: { index: false } };

/** Une commande : article, montant, date ou statut, liens. */
function OrderRow({ order }: { order: OrderSummary }) {
  const item = order.items[0];
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{item?.label ?? "—"}</span>
        <span className="text-ocre-text">{formatPrice(order.total_minor, order.currency)}</span>
      </div>
      <p className="text-small text-ink-muted">
        {order.status === "paid" && order.paid_at
          ? interpolate(tp.paidOn, { date: DATE_FORMAT.format(new Date(order.paid_at)) })
          : tp.pending}
      </p>
      <div className="flex flex-wrap gap-4 text-small">
        {order.status === "paid" && item?.book && (
          <Link href={`/livres/${item.book.slug}/lire`} className="text-encre underline">
            {tp.read}
          </Link>
        )}
        {order.receipt_url && (
          <a
            href={order.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-encre underline"
          >
            {tp.receipt}
          </a>
        )}
      </div>
    </li>
  );
}

/** Liste privée (lit la session : rendu à la demande). */
async function PurchasesContent() {
  await requireUser("/compte/achats");
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink-muted">{tp.empty}</p>
        <Link href="/recherche" className="text-encre underline">
          {tp.browse}
        </Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}

export default function PurchasesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">{tp.title}</h1>
      <Suspense>
        <PurchasesContent />
      </Suspense>
    </main>
  );
}
