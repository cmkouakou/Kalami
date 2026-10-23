/**
 * =============================================================
 *  Fichier    : page.tsx (admin/commandes)
 *  Projet     : Kalami
 *  Description: Administration des ventes (v0.10.2) : prix des études et des lots de
 *               Kalami Stratégie, puis commandes de toute la boutique filtrées par statut
 *               (?statut=…), avec lien vers Stripe, reçu et bouton « Rembourser » (API
 *               Stripe puis retrait des droits). v0.11.0 : filtre « Mobile Money à valider »,
 *               détails de la transaction déclarée, boutons « Valider » et « Refuser ».
 *               v0.14.0 : cas d'entraînement (prix, vente, corrigé « tout de suite »,
 *               accès accordé ou retiré par courriel).
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-23
 *  Dépendances: lib/admin/order-actions.ts, lib/admin/order-queries.ts, lib/currency.ts,
 *               lib/payments/mobile-money.ts, lib/admin/case-actions.ts,
 *               lib/strategy/cases/queries.ts
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field, SelectField, TextArea } from "@/components/ui/form";
import { BADGE, CARD, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import {
  refundOrder,
  rejectMobileMoney,
  saveStrategyOffer,
  validateMobileMoney,
} from "@/lib/admin/order-actions";
import {
  type AdminOrderRow,
  type AdminStudyOffer,
  listOrdersForAdmin,
  listStudyOffersForAdmin,
  ORDER_STATUSES,
  type OrderFilter,
  parseOrderStatus,
} from "@/lib/admin/order-queries";
import { savePracticeCase, setPracticeCaseAccess } from "@/lib/admin/case-actions";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { isMobileMoneyOperator, MM_OPERATOR_NAMES } from "@/lib/payments/mobile-money";
import {
  type AdminPracticeCase,
  listPracticeCasesForAdmin,
} from "@/lib/strategy/cases/queries";

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
  const [offers, cases, orders] = await Promise.all([
    listStudyOffersForAdmin(),
    listPracticeCasesForAdmin(),
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

      {/* ==================== CAS D'ENTRAÎNEMENT ==================== */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{o.casesTitle}</h2>
        <p className="max-w-3xl text-small text-ink-muted">{o.casesIntro}</p>
        {cases.map((item) => (
          <CaseForms key={item.code} item={item} />
        ))}
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

/** Réglages d'un cas d'entraînement et accès d'un compte. */
function CaseForms({ item }: { item: AdminPracticeCase }) {
  const suffix = `cas-${item.code}`;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} flex flex-col gap-3 p-4`}>
        <p className="text-small text-ink-muted">
          {interpolate(o.caseAccessCount, { count: String(item.accessCount) })}
        </p>
        <ActionForm action={savePracticeCase} submitLabel={o.save}>
          <input type="hidden" name="code" value={item.code} />
          <Field
            id={`titre-${suffix}`}
            name="title"
            label={o.caseTitle}
            defaultValue={item.title}
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
            defaultValue={item.priceXof ?? undefined}
          />
          <Field
            id={`eur-${suffix}`}
            name="priceEur"
            type="number"
            label={o.priceEur}
            min={0.01}
            step="0.01"
            defaultValue={item.priceEur ?? undefined}
          />
          <Field
            id={`cad-${suffix}`}
            name="priceCad"
            type="number"
            label={o.priceCad}
            min={0.01}
            step="0.01"
            defaultValue={item.priceCad ?? undefined}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="active" defaultChecked={item.active} className="size-5" />
            {o.caseActive}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="unlockImmediately"
              defaultChecked={item.unlockImmediately}
              className="size-5"
            />
            {o.caseImmediate}
          </label>
        </ActionForm>
      </div>
      <div className={`${CARD} flex flex-col gap-3 p-4`}>
        <h3 className="font-semibold">{o.caseAccessTitle}</h3>
        <ActionForm action={setPracticeCaseAccess} submitLabel={o.save} resetOnSuccess>
          <input type="hidden" name="code" value={item.code} />
          <Field
            id={`courriel-${suffix}`}
            name="email"
            type="email"
            label={o.caseAccessEmail}
            maxLength={254}
            required
          />
          <SelectField
            id={`intention-${suffix}`}
            name="intent"
            label={o.caseAccessTitle}
            options={[
              { value: "grant", label: o.caseGrant },
              { value: "revoke", label: o.caseRevoke },
            ]}
          />
        </ActionForm>
      </div>
    </div>
  );
}

/** Filtre par statut : liens vers ?statut=… (sans JavaScript). */
function StatusFilter({ current }: { current: OrderFilter | null }) {
  const options: { value: OrderFilter | null; label: string }[] = [
    { value: null, label: o.filterAll },
    { value: "to_review", label: o.filterToReview },
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

/** Détails d'une commande Mobile Money : numéro, référence, transaction ou motif du refus. */
function MobileMoneyDetails({ order }: { order: AdminOrderRow }) {
  const operator = isMobileMoneyOperator(order.mm_operator)
    ? MM_OPERATOR_NAMES[order.mm_operator]
    : "—";
  const country = order.mm_country ?? "";
  const countryName = (t.mobileMoney.countries as Record<string, string>)[country] ?? country;
  return (
    <div className="flex flex-col gap-1 break-all text-small">
      <p>
        {interpolate(o.mm, {
          operator,
          country: countryName,
          reference: order.mm_reference ?? "—",
        })}
      </p>
      <p className="text-ink-muted">
        {order.mm_declared_at
          ? interpolate(o.mmTransaction, {
              transaction: order.mm_transaction_id ?? "—",
              payer: order.mm_payer_number ?? "—",
              date: DATE_FORMAT.format(new Date(order.mm_declared_at)),
            })
          : o.mmNotDeclared}
      </p>
      {order.status === "failed" && order.mm_rejection_reason && (
        <p className="text-danger">
          {interpolate(o.mmRejected, { reason: order.mm_rejection_reason })}
        </p>
      )}
    </div>
  );
}

/** Valider (case de confirmation) ou refuser (motif) un paiement Mobile Money déclaré. */
function MobileMoneyReview({ order }: { order: AdminOrderRow }) {
  return (
    <div className="flex flex-col gap-3 text-small sm:flex-row sm:items-start sm:gap-8">
      <ActionForm action={validateMobileMoney} submitLabel={o.validate}>
        <input type="hidden" name="orderId" value={order.id} />
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="confirm" required className="size-5" />
          {o.validateConfirm}
        </label>
      </ActionForm>
      <details>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-danger">
          {o.reject}
        </summary>
        <ActionForm action={rejectMobileMoney} submitLabel={o.reject}>
          <input type="hidden" name="orderId" value={order.id} />
          <TextArea
            id={`motif-${order.id}`}
            name="reason"
            label={o.rejectReason}
            minLength={3}
            maxLength={300}
            rows={3}
            required
          />
        </ActionForm>
      </details>
    </div>
  );
}

/** Une commande : articles, acheteur, montant, statut, liens et remboursement. */
function OrderRow({ order }: { order: AdminOrderRow }) {
  const date = order.refunded_at ?? order.paid_at ?? order.created_at;
  const isMobileMoney = order.provider === "mobile_money";
  const toReview = isMobileMoney && order.status === "pending" && order.mm_declared_at !== null;
  return (
    <li className={`${CARD} flex flex-col gap-2 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">
          {order.labels ?? "—"}
          {toReview && <span className={`${BADGE} ml-2`}>{o.toReview}</span>}
        </span>
        <span className="text-ocre-text">{formatPrice(order.total_minor, order.currency)}</span>
      </div>
      <p className="break-all text-small text-ink-muted">
        {order.buyer_email ?? "—"} · {o.statuses[order.status]} ·{" "}
        {DATE_FORMAT.format(new Date(date))}
      </p>
      {isMobileMoney && <MobileMoneyDetails order={order} />}
      {toReview && <MobileMoneyReview order={order} />}
      <div className="flex flex-wrap gap-4 text-small">
        {!isMobileMoney && order.provider_payment_id && (
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
      {!isMobileMoney && order.status === "paid" && order.provider_payment_id && (
        <details className="text-small">
          <summary
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border
              border-danger px-4 font-semibold text-danger hover:bg-danger/10"
          >
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
