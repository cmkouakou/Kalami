/**
 * =============================================================
 *  Fichier    : page.tsx (compte/achats/[commande])
 *  Projet     : Kalami
 *  Description: Commande Mobile Money de l'acheteur (Sprint 6, v0.11.0) : montant, numéro
 *               marchand, référence et échéance, formulaire de déclaration de la
 *               transaction, puis suivi (en vérification, validée, refusée avec le motif,
 *               expirée). Une commande par carte renvoie vers la page de retour Stripe.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/payments/queries.ts, lib/payments/mobile-money.ts,
 *               lib/payments/mobile-money-actions.ts, components/admin/action-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { Field } from "@/components/ui/form";
import { BUTTON_PRIMARY, CARD } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { isUuid } from "@/lib/admin/validation";
import { requireUser } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import {
  isMobileMoneyOperator,
  MM_OPERATOR_NAMES,
  mobileMoneyStage,
} from "@/lib/payments/mobile-money";
import { declareTransaction } from "@/lib/payments/mobile-money-actions";
import { getMyOrder, orderItemLink, type OrderSummary } from "@/lib/payments/queries";

const t = getDictionary();
const mo = t.mobileMoney.order;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

export const metadata: Metadata = { title: mo.title, robots: { index: false } };

/** Date lisible (UTC, précisé à l'acheteur). */
function formatDate(iso: string | null): string {
  return iso ? `${DATE_FORMAT.format(new Date(iso))} (UTC)` : "—";
}

// ==================== ÉTAPES ====================

/** Instructions de paiement et formulaire de déclaration. */
function PayStep({ order }: { order: OrderSummary }) {
  const operator = isMobileMoneyOperator(order.mm_operator)
    ? MM_OPERATOR_NAMES[order.mm_operator]
    : "—";
  const amount = formatPrice(order.total_minor, order.currency);
  const values = {
    operator,
    amount,
    number: order.mm_merchant_number ?? "—",
    reference: order.mm_reference ?? "—",
  };
  return (
    <div className="flex flex-col gap-6">
      <dl className={`${CARD} grid gap-3 p-5 sm:grid-cols-3`}>
        <div>
          <dt className="text-small text-ink-muted">{mo.amount}</dt>
          <dd className="text-xl font-semibold text-ocre-text">{amount}</dd>
        </div>
        <div>
          <dt className="text-small text-ink-muted">
            {interpolate(mo.number, { operator })}
          </dt>
          <dd className="text-xl font-semibold">{values.number}</dd>
        </div>
        <div>
          <dt className="text-small text-ink-muted">{mo.reference}</dt>
          <dd className="text-xl font-semibold">{values.reference}</dd>
        </div>
      </dl>
      <p className="text-small text-ink-muted">
        {interpolate(mo.deadline, { date: formatDate(order.mm_expires_at) })}
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{mo.stepsTitle}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-body">
          <li>{interpolate(mo.step1, values)}</li>
          <li>{interpolate(mo.step2, values)}</li>
          <li>{mo.step3}</li>
        </ol>
      </section>

      <ActionForm action={declareTransaction.bind(null, order.id)} submitLabel={mo.declare}>
        <Field
          id="transaction"
          name="transactionId"
          label={mo.transaction}
          hint={mo.transactionHint}
          maxLength={40}
          autoComplete="off"
          required
        />
        <Field
          id="payeur"
          name="payerNumber"
          type="tel"
          label={mo.payer}
          hint={mo.payerHint}
          maxLength={20}
          autoComplete="tel"
          required
        />
      </ActionForm>
    </div>
  );
}

/** Suivi après la déclaration : vérification, validation, refus ou expiration. */
function StatusStep({ order, stage }: { order: OrderSummary; stage: string }) {
  if (stage === "to_review") {
    return (
      <p className="text-body">
        {interpolate(mo.toReview, {
          date: formatDate(order.mm_declared_at),
          transaction: order.mm_transaction_id ?? "—",
        })}
      </p>
    );
  }
  if (stage === "paid") {
    const item = order.items[0];
    const link = item && order.status === "paid" ? orderItemLink(item) : null;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body">{mo.paid}</p>
        {link && (
          <Link href={link.href} className={`${BUTTON_PRIMARY} w-fit`}>
            {mo.open}
          </Link>
        )}
      </div>
    );
  }
  if (stage === "rejected") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-body text-danger">
          {interpolate(mo.rejected, { reason: order.mm_rejection_reason ?? "—" })}
        </p>
        <p className="text-small text-ink-muted">{mo.rejectedHelp}</p>
      </div>
    );
  }
  return (
    <p className="text-body text-ink-muted">
      {interpolate(mo.expired, { reference: order.mm_reference ?? "—" })}
    </p>
  );
}

// ==================== CONTENU ====================

/** Commande de l'acheteur (lit la session : rendu à la demande). */
async function OrderContent({ params }: PageProps<"/compte/achats/[commande]">) {
  const { commande } = await params;
  await requireUser(`/compte/achats/${encodeURIComponent(commande)}`);
  const order = isUuid(commande) ? await getMyOrder(commande) : null;
  if (!order) return <p className="text-body text-ink-muted">{mo.notFound}</p>;

  const stage = mobileMoneyStage(order);
  // Commande par carte : la page de retour Stripe suit déjà son état
  if (!stage) redirect(`/compte/achats/merci?commande=${order.id}`);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-semibold">{order.items.map((item) => item.label).join(" · ")}</p>
      {stage === "to_pay" ? <PayStep order={order} /> : <StatusStep order={order} stage={stage} />}
      <Link href="/compte/achats" className="text-encre underline">
        {mo.back}
      </Link>
    </div>
  );
}

export default function MobileMoneyOrderPage(props: PageProps<"/compte/achats/[commande]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-serif text-3xl font-semibold">{mo.title}</h1>
      <Suspense>
        <OrderContent {...props} />
      </Suspense>
    </main>
  );
}
