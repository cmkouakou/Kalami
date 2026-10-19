/**
 * =============================================================
 *  Fichier    : page.tsx (admin/commandes)
 *  Projet     : Kalami
 *  Description: Administration des ventes (v0.10.2) : prix des études et des lots de
 *               Kalami Stratégie, puis commandes de toute la boutique filtrées par statut
 *               (?statut=…), avec lien vers Stripe, reçu et bouton « Rembourser » (API
 *               Stripe puis retrait des droits).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/admin/order-actions.ts, lib/admin/order-queries.ts, lib/currency.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { CARD, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { refundOrder, saveStrategyOffer } from "@/lib/admin/order-actions";
import {
  type AdminOrderRow,
  type AdminStudyOffer,
  listOrdersForAdmin,
  listStudyOffersForAdmin,
  ORDER_STATUSES,
  parseOrderStatus,
} from "@/lib/admin/order-queries";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import type { OrderStatus } from "@/lib/payments/queries";

const t = getDictionary();
const o = t.admin.orders;
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
/** Tableau de bord Stripe (mode réel) : page d'un paiement. */
const STRIPE_PAYMENT_URL = "https://dashboard.stripe.com/payments/";

export const metadata: Metadata = { title: o.title };

export default function AdminOrdersPage(props: PageProps<"/admin/commandes">) {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{o.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{o.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminOrders {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Prix des offres et liste des commandes (administrateur aal2). */
async function AdminOrders({ searchParams }: PageProps<"/admin/commandes">) {
  await requireAdmin();
  const status = parseOrderStatus((await searchParams).statut);
  const [offers, orders] = await Promise.all([
    listStudyOffersForAdmin(),
    listOrdersForAdmin(status),
  ]);

  return (
    <>
      {/* ==================== PRIX DES ÉTUDES ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{o.offersTitle}</h2>
        <p className="text-small text-ink-muted">{o.offersIntro}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {offers.map((offer) => (
            <OfferForm key={offer.code} offer={offer} />
          ))}
        </div>
      </section>

      {/* ==================== COMMANDES ==================== */}
      <section className="flex flex-col gap-4">
        <StatusFilter current={status} />
        {orders.length === 0 ? (
          <p className="text-ink-muted">{o.none}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** Formulaire de prix d'une offre d'étude ou de lot. */
function OfferForm({ offer }: { offer: AdminStudyOffer }) {
  const suffix = offer.code;
  return (
    <div className={`${CARD} flex flex-col gap-3 p-4`}>
      <p className="text-small text-ink-muted">
        {interpolate(o.offerCredits, { count: String(offer.credits) })}
      </p>
      <ActionForm action={saveStrategyOffer} submitLabel={o.save}>
        <input type="hidden" name="code" value={offer.code} />
        <Field
          id={`nom-${suffix}`}
          name="name"
          label={o.offerName}
          defaultValue={offer.name}
          maxLength={80}
          required
        />
        <Field
          id={`xof-${suffix}`}
          name="priceXof"
          type="number"
          label={o.priceXof}
          min={1}
          step="1"
          defaultValue={offer.priceXof ?? undefined}
        />
        <Field
          id={`eur-${suffix}`}
          name="priceEur"
          type="number"
          label={o.priceEur}
          min={0.01}
          step="0.01"
          defaultValue={offer.priceEur ?? undefined}
        />
        <Field
          id={`cad-${suffix}`}
          name="priceCad"
          type="number"
          label={o.priceCad}
          min={0.01}
          step="0.01"
          defaultValue={offer.priceCad ?? undefined}
        />
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={offer.active} className="size-5" />
          {o.offerActive}
        </label>
      </ActionForm>
    </div>
  );
}

/** Filtre par statut : liens vers ?statut=… (sans JavaScript). */
function StatusFilter({ current }: { current: OrderStatus | null }) {
  const options: { value: OrderStatus | null; label: string }[] = [
    { value: null, label: o.filterAll },
    ...ORDER_STATUSES.map((value) => ({ value, label: o.statuses[value] })),
  ];
  return (
    <nav aria-label={o.filter}>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.value ?? "toutes"}>
            <Link
              href={option.value ? `/admin/commandes?statut=${option.value}` : "/admin/commandes"}
              className={option.value === current ? PILL_ACTIVE : PILL}
              aria-current={option.value === current ? "page" : undefined}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Une commande : articles, acheteur, montant, statut, liens et remboursement. */
function OrderRow({ order }: { order: AdminOrderRow }) {
  const date = order.refunded_at ?? order.paid_at ?? order.created_at;
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{order.labels ?? "—"}</span>
        <span className="text-ocre-text">{formatPrice(order.total_minor, order.currency)}</span>
      </div>
      <p className="break-all text-small text-ink-muted">
        {order.buyer_email ?? "—"} · {o.statuses[order.status]} ·{" "}
        {DATE_FORMAT.format(new Date(date))}
      </p>
      <div className="flex flex-wrap gap-4 text-small">
        {order.provider_payment_id && (
          <a
            href={`${STRIPE_PAYMENT_URL}${order.provider_payment_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-encre underline"
          >
            {o.stripe}
          </a>
        )}
        {order.receipt_url && (
          <a
            href={order.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-encre underline"
          >
            {o.receipt}
          </a>
        )}
      </div>
      {order.status === "paid" && order.provider_payment_id && (
        <details className="text-small">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-danger">
            {o.refund}
          </summary>
          <ActionForm action={refundOrder} submitLabel={o.refund}>
            <input type="hidden" name="orderId" value={order.id} />
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" name="confirm" required className="size-5" />
              {o.refundConfirm}
            </label>
          </ActionForm>
        </details>
      )}
    </li>
  );
}
