/**
 * =============================================================
 *  Fichier    : mobile-money-order.tsx
 *  Projet     : Kalami
 *  Description: Blocs d'une commande Mobile Money (v0.25.0, extraits de la page Commandes) :
 *               détails de la transaction déclarée, puis formulaires « Valider » (case de
 *               confirmation) et « Refuser » (motif envoyé à l'acheteur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-11-16
 *  Dépendances: lib/admin/order-actions.ts, lib/admin/order-queries.ts,
 *               lib/payments/mobile-money.ts
 * =============================================================
 */

import { ActionForm } from "@/components/admin/action-form";
import { TextArea } from "@/components/ui/form";
import { getDictionary, interpolate } from "@/i18n";
import { rejectMobileMoney, validateMobileMoney } from "@/lib/admin/order-actions";
import type { AdminOrderRow } from "@/lib/admin/order-queries";
import { DATE_TIME_FORMAT } from "@/lib/format/date";
import { isMobileMoneyOperator, MM_OPERATOR_NAMES } from "@/lib/payments/mobile-money";

const t = getDictionary();
const o = t.admin.orders;

/** Détails d'une commande Mobile Money : numéro, référence, transaction ou motif du refus. */
export function MobileMoneyDetails({ order }: { order: AdminOrderRow }) {
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
              date: DATE_TIME_FORMAT.format(new Date(order.mm_declared_at)),
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
export function MobileMoneyReview({ order }: { order: AdminOrderRow }) {
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
