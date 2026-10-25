/**
 * =============================================================
 *  Fichier    : page.tsx (compte/achats)
 *  Projet     : Kalami
 *  Description: « Mes achats » : commandes payées ou en cours de confirmation, montant,
 *               date, lien vers ce que l'achat débloque (livre, Kalami Stratégie, coach),
 *               reçu Stripe ; les commandes remboursées restent visibles. Une commande
 *               Mobile Money montre son étape et mène à sa page (paiement, déclaration).
 *  Auteur     : Claude Marcel
 *  Version    : 1.3
 *  Date       : 2026-10-25
 *  Dépendances: lib/payments/queries.ts, lib/payments/mobile-money.ts, lib/currency.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getDictionary, interpolate } from "@/i18n";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { mobileMoneyStage, type MobileMoneyStage } from "@/lib/payments/mobile-money";
import {
  getMyOrders,
  type OrderItemLink,
  orderItemLink,
  type OrderSummary,
} from "@/lib/payments/queries";

const t = getDictionary();
const tp = t.account.purchases;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export const metadata: Metadata = { title: tp.title, robots: { index: false } };

/** Libellé du lien de chaque destination. */
const LINK_LABELS: Record<OrderItemLink["kind"], string> = {
  read: tp.read,
  strategy: tp.openStrategy,
  coach: tp.openCoach,
  case: tp.openCase,
  workshop: tp.openWorkshop,
};

/** État des commandes Mobile Money pas encore payées. */
const MM_STATUS: Partial<Record<MobileMoneyStage, string>> = {
  to_pay: tp.mmToPay,
  to_review: tp.mmToReview,
  rejected: tp.mmRejected,
};

/**
 * Ligne d'état d'une commande : payée, remboursée ou en attente.
 * @param order - Commande
 */
function statusText(order: OrderSummary): string {
  if (order.status === "refunded" && order.refunded_at) {
    return interpolate(tp.refundedOn, { date: DATE_FORMAT.format(new Date(order.refunded_at)) });
  }
  if (order.status === "paid" && order.paid_at) {
    return interpolate(tp.paidOn, { date: DATE_FORMAT.format(new Date(order.paid_at)) });
  }
  const stage = mobileMoneyStage(order);
  return (stage && MM_STATUS[stage]) ?? tp.pending;
}

/** Une commande : article, montant, date ou statut, liens. */
function OrderRow({ order }: { order: OrderSummary }) {
  const item = order.items[0];
  const link = order.status === "paid" && item ? orderItemLink(item) : null;
  const isMobileMoney = order.provider === "mobile_money";
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{item?.label ?? "—"}</span>
        <span className="text-ocre-text">{formatPrice(order.total_minor, order.currency)}</span>
      </div>
      <p className="text-small text-ink-muted">{statusText(order)}</p>
      <div className="flex flex-wrap gap-4 text-small">
        {link && (
          <Link href={link.href} className="text-encre underline">
            {LINK_LABELS[link.kind]}
          </Link>
        )}
        {isMobileMoney && (
          <Link href={`/compte/achats/${order.id}`} className="text-encre underline">
            {tp.mmOpen}
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
