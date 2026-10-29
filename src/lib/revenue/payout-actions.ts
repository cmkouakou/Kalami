/**
 * =============================================================
 *  Fichier    : payout-actions.ts
 *  Projet     : Kalami
 *  Description: Actions des versements (Sprint 10b, v0.12.1). Auteur : demander tout le
 *               disponible d'une devise, annuler une demande pas encore approuvée.
 *               Administrateur : approuver, refuser avec un motif, marquer payée avec la
 *               référence et le reçu déposé depuis le navigateur. Les fonctions SQL
 *               contrôlent les droits, les statuts et le montant, et écrivent l'audit.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-19
 *  Dépendances: lib/revenue/payout-email.ts, lib/email/send.ts, lib/supabase/*
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { requireAuthor } from "@/lib/author/queries";
import type { Currency } from "@/lib/catalog/types";
import { sendEmail } from "@/lib/email/send";
import { buildPayoutAlert, buildPayoutDecision } from "@/lib/revenue/payout-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStrategyDictionary } from "@/i18n/strategy";

const t = getDictionary();
const tStrategy = getStrategyDictionary();
const r = t.author.revenue;
const ap = t.admin.payouts;

/** Demande traitée, telle que la renvoient les fonctions de décision. */
type DecisionRow = {
  author_email: string | null;
  reference: string;
  currency: Currency;
  amount_minor: number;
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Message d'erreur connu, ou message générique.
 * @param errors - Messages de la page
 * @param code - Code renvoyé par la base
 */
function payoutError(errors: Record<string, string>, code: string): string {
  return errors[code] ?? tStrategy.errors.generic;
}

/**
 * Prévient les administrateurs d'une nouvelle demande (un courriel chacun). Un échec
 * d'envoi n'annule pas la demande : elle reste dans « À traiter ».
 * @param payoutId - Demande créée
 */
async function alertAdmins(payoutId: string): Promise<void> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("payout_requests")
    .select("reference, author_name, currency, amount_minor")
    .eq("id", payoutId)
    .single();
  if (!row) return;
  const { data: emails } = await createAdminClient().rpc("mm_admin_emails");
  for (const to of (emails ?? []) as string[]) {
    await sendEmail(
      buildPayoutAlert({
        to,
        authorName: row.author_name,
        reference: row.reference,
        currency: row.currency as Currency,
        amountMinor: Number(row.amount_minor),
      }),
    );
  }
}

/**
 * Prévient l'auteur de la décision et compose le message de l'administrateur.
 * @param data - Réponse de la fonction de décision
 * @param done - Message de la décision
 * @param extra - Transaction (payé) ou motif (refus)
 */
async function notifyAuthor(
  data: unknown,
  done: string,
  extra: { transaction?: string; rejectionReason?: string },
): Promise<FormState> {
  const row = ((data ?? []) as DecisionRow[])[0];
  if (!row?.author_email) return { message: `${done} ${ap.emailNotSent}` };
  const status = await sendEmail(
    buildPayoutDecision({
      to: row.author_email,
      reference: row.reference,
      currency: row.currency,
      amountMinor: Number(row.amount_minor),
      ...extra,
    }),
  );
  return { message: `${done} ${status === "sent" ? ap.emailSent : ap.emailNotSent}` };
}

// ==================== AUTEUR ====================

/**
 * Demande le versement de tout le disponible d'une devise.
 *
 * @param currency - Devise (liée par .bind)
 *
 * Erreurs possibles :
 *   - no_payout_details, payout_open, below_minimum, invalid_currency
 */
export async function requestPayout(currency: Currency): Promise<FormState> {
  await requireAuthor("/auteur/revenus");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("author_request_payout", { p_currency: currency });
  if (error) return { error: payoutError(r.errors, error.message) };
  await alertAdmins(String(data));
  refresh();
  return { message: r.requestSent };
}

/**
 * Annule une demande pas encore approuvée : le montant redevient disponible.
 * @param payoutId - Demande (liée par .bind)
 */
export async function cancelPayout(payoutId: string): Promise<FormState> {
  await requireAuthor("/auteur/revenus");
  const supabase = await createClient();
  const { error } = await supabase.rpc("author_cancel_payout", { p_id: payoutId });
  if (error) return { error: payoutError(r.errors, error.message) };
  refresh();
  return { message: r.cancelSent };
}

// ==================== ADMINISTRATION ====================

/**
 * Approuve une demande ; le paiement se fait ensuite hors de Kalami.
 * @param payoutId - Demande (liée par .bind)
 */
export async function approvePayout(payoutId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_payout_approve", { p_id: payoutId });
  if (error) return { error: payoutError(ap.errors, error.message) };
  refresh();
  return { message: ap.approved };
}

/**
 * Refuse une demande ouverte avec un motif envoyé à l'auteur.
 *
 * @param payoutId - Demande (liée par .bind)
 *
 * Erreurs possibles :
 *   - invalid_reason : motif de moins de 3 ou de plus de 500 caractères
 */
export async function rejectPayout(
  payoutId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3 || reason.length > 500) {
    return { error: payoutError(ap.errors, "invalid_reason") };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_payout_reject", {
    p_id: payoutId,
    p_reason: reason,
  });
  if (error) return { error: payoutError(ap.errors, error.message) };
  refresh();
  return notifyAuthor(data, ap.rejected, { rejectionReason: reason });
}

/**
 * Marque payée une demande approuvée. Le reçu éventuel a déjà été déposé par le
 * navigateur dans le seau privé ; la base vérifie son chemin et sa présence.
 *
 * @param payoutId - Demande
 * @param paymentReference - Référence de la transaction
 * @param proofPath - Chemin du reçu dans le seau, ou null
 *
 * Erreurs possibles :
 *   - invalid_payment_reference, invalid_proof, payout_not_found
 */
export async function markPayoutPaid(
  payoutId: string,
  paymentReference: string,
  proofPath: string | null,
): Promise<FormState> {
  await requireAdmin();
  const reference = paymentReference.trim();
  if (reference.length < 1 || reference.length > 120) {
    return { error: payoutError(ap.errors, "invalid_payment_reference") };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_payout_mark_paid", {
    p_id: payoutId,
    p_payment_reference: reference,
    p_proof_path: proofPath,
  });
  if (error) return { error: payoutError(ap.errors, error.message) };
  refresh();
  return notifyAuthor(data, ap.paid, { transaction: reference });
}
