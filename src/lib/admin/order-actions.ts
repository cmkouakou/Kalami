/**
 * =============================================================
 *  Fichier    : order-actions.ts
 *  Projet     : Kalami
 *  Description: Actions de l'administration des ventes (v0.10.2) : remboursement intégral
 *               d'une commande payée (API Stripe, puis retrait des droits en base) et prix
 *               des offres d'étude de Kalami Stratégie. Les fonctions SQL vérifient le rôle
 *               administrateur (aal2) et écrivent le journal d'audit. v0.11.0 : validation
 *               ou refus (avec motif) d'un paiement Mobile Money, courriel à l'acheteur.
 *  Auteur     : Claude Marcel
 *  Version    : 1.2
 *  Date       : 2026-10-22
 *  Dépendances: lib/auth/dal.ts, lib/supabase/server.ts, lib/payments/stripe.ts,
 *               lib/payments/mobile-money-email.ts, lib/email/send.ts
 * =============================================================
 */

"use server";

import { refresh } from "next/cache";

import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { isUuid } from "@/lib/admin/validation";
import { sendEmail } from "@/lib/email/send";
import { STUDY_OFFER_CODES } from "@/lib/payments/checkout-request";
import { buildDecisionEmail } from "@/lib/payments/mobile-money-email";
import { createRefund, existingFullRefund } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";

const t = getDictionary();
const o = t.admin.orders;

/** Plafond d'un prix saisi (même ordre de grandeur que les forfaits du coach). */
const PRICE_MAX = 10_000_000;

// ==================== FONCTIONS UTILITAIRES ====================

/** Message d'erreur connu, ou message générique. */
function orderError(code: string): string {
  const errors: Record<string, string> = o.errors;
  return errors[code] ?? t.strategy.errors.generic;
}

/** Lit un prix facultatif (virgule acceptée) : null si vide, NaN si invalide. */
function readPrice(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  return raw === "" ? null : Number(raw);
}

// ==================== REMBOURSEMENT ====================

/**
 * Rembourse en entier une commande payée.
 *
 * Description : vérifie la commande, demande le remboursement à Stripe (clé d'idempotence
 * par commande : un second essai ne rembourse pas deux fois), puis enregistre le
 * remboursement en base, qui retire livre, PDF, crédits non utilisés et forfaits.
 *
 * Erreurs possibles :
 *   - confirm : case de confirmation non cochée
 *   - not_refundable, no_payment : commande non payée ou sans paiement Stripe
 *   - stripe_failed : refus de Stripe (rien n'a changé dans Kalami)
 *   - refund_unrecorded : remboursé chez Stripe mais non enregistré (recommencer)
 */
export async function refundOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  if (!isUuid(orderId)) return { error: orderError("order_not_found") };
  if (formData.get("confirm") !== "on") return { error: orderError("confirm") };

  const supabase = await createClient();
  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("status, provider, provider_payment_id")
    .eq("id", orderId)
    .maybeSingle();
  if (readError || !order) return { error: orderError("order_not_found") };
  if (order.status !== "paid") return { error: orderError("not_refundable") };
  // Mobile Money : aucun remboursement automatique possible (renvoi manuel au payeur)
  if (order.provider !== "stripe") return { error: orderError("mm_refund") };
  if (!order.provider_payment_id) return { error: orderError("no_payment") };

  let refundId: string;
  try {
    refundId = (await createRefund(order.provider_payment_id, orderId)).id;
  } catch {
    // Déjà remboursé dans le tableau de bord Stripe : on enregistre ce remboursement-là
    const existing = await existingFullRefund(order.provider_payment_id);
    if (!existing) return { error: orderError("stripe_failed") };
    refundId = existing;
  }

  const { data, error } = await supabase.rpc("admin_refund_order", {
    p_order_id: orderId,
    p_refund_id: refundId,
  });
  if (error) {
    // Le webhook charge.refunded a pu enregistrer le remboursement juste avant nous
    const { data: after } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    if (after?.status !== "refunded") return { error: orderError("refund_unrecorded") };
    refresh();
    return { message: o.refundedByWebhook };
  }
  const rows = (data ?? []) as { credits_removed: number; credits_kept: number;
    packs_removed: number }[];
  const row = rows[0];
  refresh();
  return {
    message: interpolate(o.refunded, {
      removed: String(row?.credits_removed ?? 0),
      kept: String(row?.credits_kept ?? 0),
      packs: String(row?.packs_removed ?? 0),
    }),
  };
}

// ==================== MOBILE MONEY ====================

/** Commande traitée, telle que la renvoient les fonctions de décision. */
type DecisionRow = {
  buyer_email: string | null;
  labels: string | null;
  total_minor: number;
  reference: string | null;
};

/**
 * Prévient l'acheteur de la décision et compose le message de l'administrateur.
 * @param row - Commande traitée
 * @param done - Message de la décision
 * @param rejectionReason - Motif du refus (absent : paiement validé)
 */
async function notifyBuyer(
  row: DecisionRow | undefined,
  done: string,
  rejectionReason?: string,
): Promise<FormState> {
  if (!row?.buyer_email) return { message: `${done} ${o.emailNotSent}` };
  const status = await sendEmail(
    buildDecisionEmail({
      to: row.buyer_email,
      totalMinor: Number(row.total_minor),
      labels: row.labels ?? "—",
      reference: row.reference ?? "—",
      rejectionReason,
    }),
  );
  return { message: `${done} ${status === "sent" ? o.emailSent : o.emailNotSent}` };
}

/**
 * Valide un paiement Mobile Money déclaré, vu sur le relevé de l'opérateur.
 *
 * Description : la base passe la commande à « payée », accorde les droits (même livraison
 * que la carte), écrit l'audit ; l'acheteur reçoit ensuite un courriel de confirmation.
 *
 * Erreurs possibles :
 *   - confirm : case non cochée
 *   - order_not_found, not_declared : commande absente, déjà traitée ou non déclarée
 */
export async function validateMobileMoney(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  if (!isUuid(orderId)) return { error: orderError("order_not_found") };
  if (formData.get("confirm") !== "on") return { error: orderError("confirm") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_mm_validate", { p_order_id: orderId });
  if (error) return { error: orderError(error.message) };
  refresh();
  return notifyBuyer(((data ?? []) as DecisionRow[])[0], o.validated);
}

/**
 * Refuse un paiement Mobile Money (introuvable sur le relevé, montant faux…).
 * Le motif est enregistré, journalisé et envoyé à l'acheteur.
 *
 * Erreurs possibles :
 *   - invalid_reason : motif de moins de 3 ou de plus de 300 caractères
 *   - order_not_found : commande absente ou déjà traitée
 */
export async function rejectMobileMoney(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  if (!isUuid(orderId)) return { error: orderError("order_not_found") };
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3 || reason.length > 300) return { error: orderError("invalid_reason") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_mm_reject", {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) return { error: orderError(error.message) };
  refresh();
  return notifyBuyer(((data ?? []) as DecisionRow[])[0], o.rejected, reason);
}

// ==================== OFFRES D'ÉTUDE ====================

/** Modifie le nom, les prix et l'état d'une offre d'étude ou de lot. */
export async function saveStrategyOffer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceXof = readPrice(formData, "priceXof");
  const priceEur = readPrice(formData, "priceEur");
  const priceCad = readPrice(formData, "priceCad");

  if (!STUDY_OFFER_CODES.some((known) => known === code)) {
    return { error: orderError("offer_not_found") };
  }
  if (name.length < 1 || name.length > 80) return { error: orderError("invalid_name") };
  const pricesOk = [priceXof, priceEur, priceCad].every(
    (price) => price === null || (Number.isFinite(price) && price > 0 && price <= PRICE_MAX),
  );
  if (!pricesOk || (priceXof !== null && !Number.isInteger(priceXof))) {
    return { error: orderError("invalid_price") };
  }

  const toCents = (price: number | null) => (price === null ? null : Math.round(price * 100) / 100);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_strategy_offer", {
    p_code: code,
    p_name: name,
    p_price_xof: priceXof,
    p_price_eur: toCents(priceEur),
    p_price_cad: toCents(priceCad),
    p_active: formData.get("active") === "on",
  });
  if (error) return { error: orderError(error.message) };
  refresh();
  return { message: o.offerSaved };
}
