/**
 * =============================================================
 *  Fichier    : page.tsx (admin/versements)
 *  Projet     : Kalami
 *  Description: Versements aux auteurs (Sprint 10b, v0.12.1, cahier §3.10) : demandes à
 *               traiter (les plus anciennes d'abord) ou filtrées par statut, coordonnées de
 *               versement au moment de la demande, approbation, refus avec motif, paiement
 *               marqué avec la référence de la transaction et le reçu.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/revenue/payout-actions.ts, lib/revenue/payout-queries.ts,
 *               components/admin/payout-paid-form.tsx
 * =============================================================
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActionForm } from "@/components/admin/action-form";
import { PayoutPaidForm } from "@/components/admin/payout-paid-form";
import { TextArea } from "@/components/ui/form";
import { BADGE, CARD, PILL, PILL_ACTIVE } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { formatPrice } from "@/lib/currency";
import { approvePayout, rejectPayout } from "@/lib/revenue/payout-actions";
import { listPayoutsAdmin, signProofUrls } from "@/lib/revenue/payout-queries";
import { isPayoutStatus, type PayoutRequest, type PayoutStatus } from "@/lib/revenue/payouts";

const t = getDictionary();
const ap = t.admin.payouts;
const statuses = t.author.revenue.statuses;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

const PAGE_URL = "/admin/versements";

/** Filtres proposés : demandes ouvertes (null), puis statuts terminés. */
const FILTERS: { value: PayoutStatus | null; label: string }[] = [
  { value: null, label: ap.filters.open },
  { value: "paid", label: ap.filters.paid },
  { value: "rejected", label: ap.filters.rejected },
  { value: "cancelled", label: ap.filters.cancelled },
];

/** Ordre d'affichage des coordonnées de versement. */
const DETAIL_FIELDS = [
  "account_holder",
  "bank_name",
  "account_number",
  "swift",
  "mobile_operator",
  "mobile_number",
] as const;

export const metadata: Metadata = { title: ap.title };

export default function AdminPayoutsPage(props: PageProps<"/admin/versements">) {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold">{ap.title}</h1>
        <p className="max-w-3xl text-small text-ink-muted">{ap.intro}</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse" />}>
        <AdminPayouts {...props} />
      </Suspense>
    </main>
  );
}

// ==================== CONTENU ====================

/** Filtre et liste des demandes (administrateur aal2). */
async function AdminPayouts({ searchParams }: PageProps<"/admin/versements">) {
  await requireAdmin();
  const raw = (await searchParams).statut;
  const status = isPayoutStatus(raw) ? raw : null;
  const payouts = await listPayoutsAdmin(status);
  const proofUrls = await signProofUrls(payouts);

  return (
    <section className="flex flex-col gap-4">
      <nav aria-label={ap.title}>
        <ul className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <li key={filter.value ?? "ouvertes"}>
              <Link
                href={filter.value ? `${PAGE_URL}?statut=${filter.value}` : PAGE_URL}
                className={filter.value === status ? PILL_ACTIVE : PILL}
                aria-current={filter.value === status ? "page" : undefined}
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {payouts.length === 0 ? (
        <p className="text-ink-muted">{ap.none}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {payouts.map((payout) => (
            <PayoutCard key={payout.id} payout={payout} proofUrl={proofUrls.get(payout.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

// ==================== DEMANDE ====================

type PayoutCardProps = { payout: PayoutRequest; proofUrl?: string };

/** Une demande : montant, coordonnées, puis l'étape suivante selon le statut. */
function PayoutCard({ payout, proofUrl }: PayoutCardProps) {
  return (
    <li className={`${CARD} flex flex-col gap-4 p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex flex-col">
          <span className="font-semibold">{payout.author_name}</span>
          <span className="font-mono text-xs text-ink-muted">{payout.reference}</span>
        </p>
        <p className="flex items-center gap-3">
          <span className="font-serif text-2xl font-semibold">
            {formatPrice(payout.amount_minor, payout.currency)}
          </span>
          <span className={BADGE}>{statuses[payout.status]}</span>
        </p>
      </div>
      <p className="text-sm text-ink-muted">
        {interpolate(ap.requestedOn, { date: DATE_FORMAT.format(new Date(payout.created_at)) })}
      </p>
      <PayoutDetails payout={payout} />
      <PayoutStep payout={payout} proofUrl={proofUrl} />
    </li>
  );
}

/** Coordonnées de versement enregistrées au moment de la demande. */
function PayoutDetails({ payout }: { payout: PayoutRequest }) {
  const rows = DETAIL_FIELDS.filter((field) => payout.payout_details[field]);
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="font-medium">
        {ap.details} : {ap.methods[payout.payout_method]}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map((field) => (
          <div key={field} className="contents">
            <dt className="text-ink-muted">{ap.fields[field]}</dt>
            <dd className="break-all font-mono">{payout.payout_details[field]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Étape suivante (approuver, payer, refuser) ou résultat d'une demande terminée. */
function PayoutStep({ payout, proofUrl }: PayoutCardProps) {
  const date = (value: string | null) => (value ? DATE_FORMAT.format(new Date(value)) : "—");

  if (payout.status === "paid") {
    return (
      <p className="flex flex-wrap gap-3 text-sm">
        {interpolate(ap.paidOn, {
          date: date(payout.paid_at),
          reference: payout.payment_reference ?? "—",
        })}
        {proofUrl && (
          <a href={proofUrl} target="_blank" rel="noopener" className="text-encre underline">
            {ap.openProof}
          </a>
        )}
      </p>
    );
  }
  if (payout.status === "rejected") {
    return (
      <p className="text-sm">
        {interpolate(ap.rejectedBecause, {
          date: date(payout.rejected_at),
          reason: payout.rejection_reason ?? "—",
        })}
      </p>
    );
  }
  if (payout.status === "cancelled") {
    return (
      <p className="text-sm">{interpolate(ap.cancelledOn, { date: date(payout.cancelled_at) })}</p>
    );
  }

  return (
    <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-2">
      {payout.status === "requested" ? (
        <ActionForm action={approvePayout.bind(null, payout.id)} submitLabel={ap.approve}>
          {null}
        </ActionForm>
      ) : (
        <PayoutPaidForm payoutId={payout.id} />
      )}
      <ActionForm action={rejectPayout.bind(null, payout.id)} submitLabel={ap.reject}>
        <TextArea
          id={`motif-${payout.id}`}
          name="reason"
          label={ap.rejectReason}
          rows={2}
          minLength={3}
          maxLength={500}
          required
        />
      </ActionForm>
    </div>
  );
}
